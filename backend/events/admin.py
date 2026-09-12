from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Event, EventRSVP


@admin.register(Event)
class EventAdmin(ModelAdmin):
    list_display = (
        'listing',
        'category',
        'event_date',
        'venue',
        'is_free',
        'is_online',
        'is_upcoming',
        'images_link',
    )
    list_filter = (
        'category',
        'is_free',
        'is_online',
    )
    search_fields = (
        'listing__title',
        'listing__location',
        'venue',
        'organiser',
    )
    ordering = ('event_date',)
    readonly_fields = ('images_link',)

    fieldsets = (
        ('Event Details', {
            'fields': ('listing', 'category', 'organiser'),
            'classes': ['tab'],
        }),
        ('Date & Venue', {
            'fields': ('event_date', 'event_end_date', 'venue', 'is_online', 'event_url'),
            'classes': ['tab'],
        }),
        ('Tickets', {
            'fields': ('is_free', 'ticket_price', 'max_attendees'),
            'classes': ['tab'],
        }),
        ('Images', {
            'fields': ('images_link',),
            'classes': ['tab'],
        }),
    )

    def images_link(self, obj):
        if not obj.pk:
            return '—'
        url = reverse('admin:listings_listing_change', args=[obj.listing_id])
        count = obj.listing.images.count()
        label = f'{count} image{"s" if count != 1 else ""} — click to manage'
        return format_html(
            '<a href="{}" style="background:#534AB7;color:#fff;padding:6px 14px;'
            'border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">'
            '🖼 {}</a>',
            url, label,
        )
    images_link.short_description = 'Images'


@admin.register(EventRSVP)
class EventRSVPAdmin(ModelAdmin):
    list_display = ('user', 'event', 'created_at')
    search_fields = ('user__email', 'event__listing__title')
    readonly_fields = ('user', 'event', 'created_at')
    ordering = ('-created_at',)