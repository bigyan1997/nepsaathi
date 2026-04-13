from django.contrib import admin
from .models import Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """
    Admin configuration for Room listings.
    """
    list_display = (
        'listing',
        'room_type',
        'price_display',
        'furnishing',
        'bills_included',
        'nepalese_household',
        'available_from',
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

    fieldsets = (
        ('Room Details', {
            'fields': ('listing', 'room_type', 'furnishing')
        }),
        ('Pricing', {
            'fields': ('price', 'bond', 'bills_included')
        }),
        ('Property Info', {
            'fields': (
                'bedrooms',
                'bathrooms',
                'max_occupants',
                'available_from',
            )
        }),
        ('Extra Features', {
            'fields': (
                'nepalese_household',
                'pets_allowed',
                'parking_available',
            )
        }),
    )