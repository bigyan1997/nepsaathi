from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .throttles import MessageSendThrottle


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

        if int(recipient_id) == request.user.id:
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
            listing_id=listing_id or None,
        ).filter(participants=recipient).first()

        if existing:
            serializer = ConversationSerializer(existing, context={'request': request})
            return Response({**serializer.data, 'existing': True})

        convo = Conversation.objects.create(
            listing_id=listing_id or None,
            listing_title=listing_title[:300],
            listing_type=listing_type[:20],
        )
        convo.participants.add(request.user, recipient)

        Message.objects.create(
            conversation=convo,
            sender=request.user,
            content=initial_message,
        )

        serializer = ConversationSerializer(convo, context={'request': request})
        return Response({**serializer.data, 'existing': False}, status=201)


class ConversationDetailView(APIView):
    """
    GET  /api/messages/<id>/       — get messages in a conversation
    POST /api/messages/<id>/send/  — send a message
    POST /api/messages/<id>/read/  — mark all messages as read
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
        messages.exclude(sender=request.user).filter(is_read=False).update(is_read=True)
        serializer = MessageSerializer(messages, many=True)
        convo_data = ConversationSerializer(convo, context={'request': request}).data
        return Response({'conversation': convo_data, 'messages': serializer.data})


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
        # Touch conversation updated_at for ordering
        convo.save(update_fields=['updated_at'])

        return Response(MessageSerializer(msg).data, status=201)


class UnreadCountView(APIView):
    """GET /api/messages/unread-count/ — total unread messages for navbar badge"""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        count = Message.objects.filter(
            conversation__participants=request.user,
            is_read=False,
        ).exclude(sender=request.user).count()
        return Response({'unread_count': count})
