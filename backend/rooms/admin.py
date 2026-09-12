from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import Room


@admin.register(Room)
class RoomAdmin(ModelAdmin):
    list_display = (
        'listing',
        'room_type',
        'price_display',
        'furnishing',
        'bills_included',
        'nepalese_household',
        'available_from',
        'images_link',
    )
    list_filter = (
        'room_type',
        'furnishing',
        'bills_included',
        'nepalese_household',
        'pets_allowed',
        'parking_available',
    )
    search_fields = (
        'listing__title',
        'listing__location',
    )
    readonly_fields = ('images_link',)

    fieldsets = (
        ('Room Details', {
            'fields': ('listing', 'room_type', 'furnishing'),
            'classes': ['tab'],
        }),
        ('Pricing', {
            'fields': ('price', 'bond', 'bills_included'),
            'classes': ['tab'],
        }),
        ('Property Info', {
            'fields': (
                'bedrooms',
                'bathrooms',
                'max_occupants',
                'available_from',
            ),
            'classes': ['tab'],
        }),
        ('Extra Features', {
            'fields': (
                'nepalese_household',
                'pets_allowed',
                'parking_available',
            ),
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