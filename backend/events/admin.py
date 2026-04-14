from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin configuration for Events."""

    list_display = (
        'listing',
        'category',
        'event_date',
        'venue',
        'is_free',
        'is_online',
        'is_upcoming',
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

    fieldsets = (
        ('Event Details', {
            'fields': ('listing', 'category', 'organiser')
        }),
        ('Date & Venue', {
            'fields': ('event_date', 'event_end_date', 'venue', 'is_online', 'event_url')
        }),
        ('Tickets', {
            'fields': ('is_free', 'ticket_price', 'max_attendees')
        }),
    )