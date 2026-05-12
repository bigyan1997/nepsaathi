from django.conf import settings
from django.db import models


class Conversation(models.Model):
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
    )
    listing_id = models.IntegerField(null=True, blank=True)
    listing_title = models.CharField(max_length=300, blank=True)
    listing_type = models.CharField(max_length=20, blank=True)
    hidden_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='hidden_conversations',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']

    def other_participant(self, user):
        return self.participants.exclude(pk=user.pk).first()

    @property
    def unread_count_for(self):
        return self.messages.filter(is_read=False).count()


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    content = models.TextField(max_length=2000)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
