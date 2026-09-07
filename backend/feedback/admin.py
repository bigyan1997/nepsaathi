from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import FeedbackResponse, NewsletterSubscriber


@admin.register(FeedbackResponse)
class FeedbackResponseAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'satisfaction_stars', 'reason_display', 'short_message', 'page_url', 'user')
    list_filter = ('satisfaction', 'reason', 'created_at')
    search_fields = ('user__email', 'page_url', 'message')
    readonly_fields = ('satisfaction', 'reason', 'message', 'page_url', 'user', 'created_at')
    ordering = ('-created_at',)

    def satisfaction_stars(self, obj):
        labels = {1: '★ Very bad', 2: '★★ Not great', 3: '★★★ Okay', 4: '★★★★ Good', 5: '★★★★★ Love it!'}
        return labels.get(obj.satisfaction, obj.satisfaction)
    satisfaction_stars.short_description = 'Rating'

    def reason_display(self, obj):
        return obj.get_reason_display()
    reason_display.short_description = 'Reason'

    def short_message(self, obj):
        return (obj.message[:60] + "…") if len(obj.message) > 60 else obj.message
    short_message.short_description = 'Message'


def export_emails_csv(modeladmin, request, queryset):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="newsletter_subscribers.csv"'
    writer = csv.writer(response)
    writer.writerow(['Email', 'Subscribed At', 'Active'])
    for sub in queryset:
        writer.writerow([sub.email, sub.subscribed_at.strftime('%Y-%m-%d %H:%M'), sub.is_active])
    return response
export_emails_csv.short_description = 'Export selected as CSV'


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'subscribed_at', 'is_active')
    list_filter = ('is_active', 'subscribed_at')
    search_fields = ('email',)
    readonly_fields = ('email', 'subscribed_at')
    ordering = ('-subscribed_at',)
    actions = [export_emails_csv]
