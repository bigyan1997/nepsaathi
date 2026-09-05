from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or "NepSaathi User"

    class Meta:
        model = Message
        fields = ('id', 'sender_id', 'sender_name', 'content', 'is_read', 'created_at')
        read_only_fields = ('id', 'sender_id', 'sender_name', 'is_read', 'created_at')


class ConversationSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    def get_other_user(self, obj):
        request = self.context.get('request')
        other = obj.other_participant(request.user)
        if not other:
            return None
        return {
            'id': other.id,
            'name': f"{other.first_name} {other.last_name}".strip() or "NepSaathi User",
            'avatar': getattr(other, 'avatar', None) or getattr(other, 'google_avatar', None),
        }

    def get_last_message(self, obj):
        msgs = obj.messages.all()  # uses prefetch cache
        if not msgs:
            return None
        msg = max(msgs, key=lambda m: m.created_at)
        return {
            'content': msg.content[:80],
            'created_at': msg.created_at,
            'sender_id': msg.sender_id,
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        return sum(
            1 for m in obj.messages.all()  # uses prefetch cache
            if not m.is_read and m.sender_id != request.user.id
        )

    class Meta:
        model = Conversation
        fields = (
            'id', 'listing_id', 'listing_title', 'listing_type',
            'other_user', 'last_message', 'unread_count', 'updated_at',
        )
