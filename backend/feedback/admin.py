from django.contrib import admin
from .models import FeedbackResponse


@admin.register(FeedbackResponse)
class FeedbackResponseAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'satisfaction', 'reason_display', 'page_url', 'user')
    list_filter = ('satisfaction', 'reason', 'created_at')
    search_fields = ('user__email', 'page_url')
    readonly_fields = ('satisfaction', 'reason', 'page_url', 'user', 'created_at')
    ordering = ('-created_at',)

    def reason_display(self, obj):
        return obj.get_reason_display()
    reason_display.short_description = 'Reason'
