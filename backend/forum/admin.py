from django.contrib import admin
from .models import ForumPost, ForumReply


class ForumReplyInline(admin.TabularInline):
    model = ForumReply
    extra = 0
    readonly_fields = ('author', 'body', 'created_at')
    can_delete = True


@admin.register(ForumPost)
class ForumPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'reply_count', 'upvote_count', 'is_pinned', 'is_closed', 'created_at')
    list_filter = ('category', 'is_pinned', 'is_closed')
    search_fields = ('title', 'body', 'author__email')
    readonly_fields = ('slug', 'view_count', 'created_at', 'updated_at')
    list_editable = ('is_pinned', 'is_closed')
    inlines = (ForumReplyInline,)
    actions = ('pin_posts', 'unpin_posts', 'close_posts')

    def reply_count(self, obj):
        return obj.replies.count()
    reply_count.short_description = 'Replies'

    def upvote_count(self, obj):
        return obj.upvotes.count()
    upvote_count.short_description = 'Upvotes'

    @admin.action(description='Pin selected posts')
    def pin_posts(self, request, queryset):
        queryset.update(is_pinned=True)

    @admin.action(description='Unpin selected posts')
    def unpin_posts(self, request, queryset):
        queryset.update(is_pinned=False)

    @admin.action(description='Close selected posts')
    def close_posts(self, request, queryset):
        queryset.update(is_closed=True)


@admin.register(ForumReply)
class ForumReplyAdmin(admin.ModelAdmin):
    list_display = ('author', 'post', 'created_at')
    search_fields = ('body', 'author__email', 'post__title')
    readonly_fields = ('created_at', 'updated_at')
