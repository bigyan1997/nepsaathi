from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import Event, EventRSVP


@admin.register(Event)
class EventAdmin(ModelAdmin):
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
    )


@admin.register(EventRSVP)
class EventRSVPAdmin(ModelAdmin):
    list_display = ('user', 'event', 'created_at')
    search_fields = ('user__email', 'event__listing__title')
    readonly_fields = ('user', 'event', 'created_at')
    ordering = ('-created_at',)