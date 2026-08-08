import logging
import threading

from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from rest_framework.response import Response
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
