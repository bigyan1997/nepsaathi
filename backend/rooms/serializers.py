from rest_framework import serializers
from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for room-specific listing details.

    price_display    — read only formatted string e.g. $250/wk
    listing_title    — read only, parent listing title
    listing_location — read only, where the room is
    listing_state    — read only, which state
    """
    price_display = serializers.ReadOnlyField()
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_location = serializers.CharField(source='listing.location', read_only=True)
    listing_state = serializers.CharField(source='listing.state', read_only=True)
    listing_id = serializers.IntegerField(source='listing.id', read_only=True)
    posted_by = serializers.CharField(source='listing.user.full_name', read_only=True)
    created_at = serializers.DateTimeField(source='listing.created_at', read_only=True)
    contact_phone = serializers.CharField(source='listing.contact_phone', read_only=True)
    contact_whatsapp = serializers.CharField(source='listing.contact_whatsapp', read_only=True)

    class Meta:
        model = Room
        fields = (
            'id',
            'listing_id',
            'listing_title',
            'listing_location',
            'listing_state',
            'posted_by',
            'contact_phone',
            'contact_whatsapp',
            'room_type',
            'price',
            'price_display',
            'furnishing',
            'bond',
            'bills_included',
            'available_from',
            'bedrooms',
            'bathrooms',
            'max_occupants',
            'nepalese_household',
            'pets_allowed',
            'parking_available',
            'created_at',
        )
        read_only_fields = (
            'id',
            'price_display',
            'listing_title',
            'listing_location',
            'listing_state',
            'listing_id',
            'posted_by',
            'contact_phone',
            'contact_whatsapp',
            'created_at',
        )