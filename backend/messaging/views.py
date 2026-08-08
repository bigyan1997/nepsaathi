import logging
import threading

from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .throttles import MessageSendThrottle
from .cache import bump_unread, invalidate_unread, get_cached_unread, set_cached_unread

logger = logging.getLogger(__name__)


class ConversationListView(APIView):
    """
    GET  /api/messages/          — list user's conversations
    POST /api/messages/          — start or retrieve conversation about a listing
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        convos = Conversation.objects.filter(
            participants=request.user
        ).prefetch_related('participants', 'messages').order_by('-updated_at')
        try:
            convos = convos.exclude(hidden_by=request.user)
        except Exception:
            pass
        serializer = ConversationSerializer(convos, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        recipient_id = request.data.get('recipient_id')
        listing_id = request.data.get('listing_id')
        listing_title = request.data.get('listing_title', '')
        listing_type = request.data.get('listing_type', '')
        initial_message = request.data.get('message', '').strip()

        if not recipient_id:
            raise ValidationError({'recipient_id': 'This field is required.'})

        try:
            recipient_id = int(recipient_id)
        except (TypeError, ValueError):
            raise ValidationError({'recipient_id': 'Must be a valid user ID.'})

        if recipient_id == request.user.id:
            raise ValidationError('You cannot message yourself.')

        if not initial_message:
            raise ValidationError({'message': 'An initial message is required.'})

        if len(initial_message) > 2000:
            raise ValidationError({'message': 'Message cannot exceed 2000 characters.'})

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            recipient = User.objects.get(pk=recipient_id)
        except User.DoesNotExist:
            raise NotFound('User not found.')

        # Find existing conversation between these two users about this listing
        existing = Conversation.objects.filter(
            participants=request.user,
            listing_id=listing_id if listing_id else None,
        ).filter(participants=recipient).first()

        if existing:
            Message.objects.create(
                conversation=existing,
                sender=request.user,
                content=initial_message,
            )
            existing.save(update_fields=['updated_at'])
            try:
                # Unhide for both parties so the conversation reappears in both inboxes
                existing.hidden_by.remove(request.user, recipient)
            except Exception:
                pass
            self._notify(recipient, request.user, initial_message, existing.pk)
            bump_unread(recipient.pk)
            serializer = ConversationSerializer(existing, context={'request': request})
            return Response({**serializer.data, 'existing': True})

        convo = Conversation.objects.create(
            listing_id=listing_id if listing_id else None,
            listing_title=listing_title[:300],
            listing_type=listing_type[:20],
        )
        convo.participants.add(request.user, recipient)

        Message.objects.create(
            conversation=convo,
            sender=request.user,
            content=initial_message,
        )

        self._notify(recipient, request.user, initial_message, convo.pk)
        bump_unread(recipient.pk)
        serializer = ConversationSerializer(convo, context={'request': request})
        return Response({**serializer.data, 'existing': False}, status=201)

    @staticmethod
    def _notify(recipient, sender, content, convo_pk):
        try:
            from core.push import send_push_notification
            sender_name = sender.full_name or sender.email
            threading.Thread(
                target=send_push_notification,
                args=(recipient, f'New message from {sender_name}', content[:80], f'/messages/{convo_pk}'),
            ).start()
        except Exception as e:
            logger.warning('Push notification failed for initial message: %s', e)


class ConversationDetailView(APIView):
    """
    GET  /api/messages/<id>/       — get messages; marks incoming messages as read as a side effect
    POST /api/messages/<id>/send/  — send a message
    """
    permission_classes = (permissions.IsAuthenticated,)

    def _get_conversation(self, pk, user):
        try:
            convo = Conversation.objects.prefetch_related('participants').get(pk=pk)
        except Conversation.DoesNotExist:
            raise NotFound('Conversation not found.')
        if not convo.participants.filter(pk=user.pk).exists():
            raise PermissionDenied('You are not a participant in this conversation.')
        return convo

    def get(self, request, pk):
        convo = self._get_conversation(pk, request.user)
        messages = convo.messages.select_related('sender').order_by('created_at')
        # Mark messages from other user as read
        marked = messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        if marked:
            invalidate_unread(request.user.pk)
        serializer = MessageSerializer(messages, many=True)
        convo_data = ConversationSerializer(convo, context={'request': request}).data
        return Response({'conversation': convo_data, 'messages': serializer.data})

    def delete(self, request, pk):
        convo = self._get_conversation(pk, request.user)
        convo.hidden_by.add(request.user)
        return Response(status=204)


class MessageSendView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (MessageSendThrottle,)

    def post(self, request, pk):
        try:
            convo = Conversation.objects.prefetch_related('participants').get(pk=pk)
        except Conversation.DoesNotExist:
            raise NotFound('Conversation not found.')

        if not convo.participants.filter(pk=request.user.pk).exists():
            raise PermissionDenied('You are not a participant in this conversation.')

        content = request.data.get('content', '').strip()
        if not content:
            raise ValidationError({'content': 'Message cannot be empty.'})
        if len(content) > 2000:
            raise ValidationError({'content': 'Message cannot exceed 2000 characters.'})

        msg = Message.objects.create(
            conversation=convo,
            sender=request.user,
            content=content,
        )
        convo.save(update_fields=['updated_at'])
        # Sending a message unhides the conversation for both parties
        try:
            convo.hidden_by.clear()
        except Exception:
            pass

        # Broadcast via channel layer (async_to_sync is the documented way from sync views)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            ch = get_channel_layer()
            if ch:
                async_to_sync(ch.group_send)(
                    f"conversation_{convo.pk}",
                    {"type": "chat_message", "message": MessageSerializer(msg).data},
                )
                logger.info("WS broadcast OK for conversation %s", convo.pk)
            else:
                logger.warning("No channel layer configured — WS broadcast skipped")
        except Exception as e:
            logger.error("WS broadcast failed for conversation %s: %s", convo.pk, e, exc_info=True)

        # Push notification to the other participant
        recipient = convo.participants.exclude(pk=request.user.pk).first()
        if recipient:
            bump_unread(recipient.pk)
            from core.push import send_push_notification
            sender_name = request.user.full_name or request.user.email
            threading.Thread(
                target=send_push_notification,
                args=(recipient, f'New message from {sender_name}', content[:80], f'/messages/{convo.pk}'),
            ).start()

        return Response(MessageSerializer(msg).data, status=201)


class UnreadCountView(APIView):
    """GET /api/messages/unread-count/ — total unread messages for navbar badge"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        cached = get_cached_unread(request.user.pk)
        if cached is not None:
            return Response({'unread_count': cached})
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False,
        ).exclude(sender=request.user).count()
        set_cached_unread(request.user.pk, count)
        return Response({'unread_count': count})


class SuggestRepliesView(APIView):
    """POST /api/messages/suggest-replies/ — returns 3 short reply suggestions using Llama 3 via Groq."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'suggest_replies'

    def _build_listing_context(self, conversation):
        """Fetch the full listing and return a context string for the AI prompt."""
        if not conversation.listing_id:
            return conversation.listing_title or ''
        try:
            from listings.models import Listing
            listing = Listing.objects.select_related(
                'job_detail', 'room_detail'
            ).get(pk=conversation.listing_id)
        except Exception:
            return conversation.listing_title or ''

        parts = [
            f"Type: {listing.listing_type}",
            f"Title: {listing.title}",
            f"Location: {listing.location}, {listing.state}, Australia",
            f"Description: {listing.description[:400]}",
        ]
        # Add type-specific details
        try:
            jd = listing.job_detail
            parts.append(f"Job type: {jd.job_type}")
            parts.append(f"Salary: {jd.salary_display}")
            if jd.company_name:
                parts.append(f"Company: {jd.company_name}")
        except Exception:
            pass
        try:
            rd = listing.room_detail
            parts.append(f"Room type: {rd.get_room_type_display()}")
            parts.append(f"Rent: {rd.price_display}")
        except Exception:
            pass
        return '\n'.join(parts)

    def post(self, request):
        import groq as groq_sdk
        import json, re
        from decouple import config as env_config

        last_message = (request.data.get('last_message') or '').strip()
        conversation_id = request.data.get('conversation_id')

        if not last_message:
            return Response({'error': 'No message provided.'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = env_config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'AI service not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Build listing context from DB if we have a conversation ID
        listing_context = ''
        if conversation_id:
            try:
                conv = Conversation.objects.get(pk=conversation_id, participants=request.user)
                listing_context = self._build_listing_context(conv)
            except Conversation.DoesNotExist:
                pass

        context_block = f"Listing being discussed:\n{listing_context}\n\n" if listing_context else ''

        prompt = f"""You are helping someone reply to a message on NepSaathi, a classifieds platform for Nepalese Australians.

{context_block}Message received:
"{last_message}"

Write exactly 3 short, natural reply options. Each should be 1-2 sentences, friendly and direct. Make them relevant to the listing details above. Cover different intents (e.g. interested, asking a specific question about the listing, declining politely).

Return ONLY a JSON array of 3 strings, no explanation. Example format:
["Reply one.", "Reply two.", "Reply three."]"""

        try:
            client = groq_sdk.Groq(api_key=api_key)
            chat = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = chat.choices[0].message.content.strip()
            match = re.search(r'\[.*?\]', raw, re.DOTALL)
            if not match:
                return Response({'error': 'Could not parse suggestions.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            suggestions = json.loads(match.group())
            suggestions = [s.strip() for s in suggestions if isinstance(s, str) and s.strip()][:3]
            return Response({'suggestions': suggestions})
        except Exception as e:
            logger.error("Groq API error in suggest-replies: %s", e)
            return Response({'error': 'AI service temporarily unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
