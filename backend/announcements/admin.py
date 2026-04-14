from django.contrib import admin
from .models import Announcement


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    """Admin configuration for Announcements."""

    list_display = (
        'listing',
        'category',
        'price_display',
        'condition',
        'is_free',
        'is_urgent',
    )
    list_filter = (
        'category',
        'condition',
        'is_free',
        'is_urgent',
    )
    search_fields = (
        'listing__title',
        'listing__location',
        'listing__user__email',
    )

    fieldsets = (
        ('Announcement Details', {
            'fields': ('listing', 'category', 'is_urgent')
        }),
        ('Pricing', {
            'fields': ('price', 'is_free', 'condition')
        }),
    )