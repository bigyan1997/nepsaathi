from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('sender', 'content', 'is_read', 'created_at')
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing_title', 'listing_type', 'participant_list', 'updated_at')
    list_filter = ('listing_type',)
    search_fields = ('listing_title', 'participants__email')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [MessageInline]

    def participant_list(self, obj):
        return ', '.join(p.email for p in obj.participants.all())
    participant_list.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'conversation', 'content_preview', 'is_read', 'created_at')
    list_filter = ('is_read',)
    search_fields = ('sender__email', 'content')
    readonly_fields = ('sender', 'conversation', 'content', 'is_read', 'created_at')

    def content_preview(self, obj):
        return obj.content[:60]
    content_preview.short_description = 'Content'
