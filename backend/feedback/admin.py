from django.contrib import admin
from django.http import HttpResponse
import csv
from .models import FeedbackResponse, NewsletterSubscriber


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
