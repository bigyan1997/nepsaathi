from rest_framework import serializers
from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for room-specific listing details.
    price_display is a read-only formatted string e.g. $250/wk
    """
    price_display = serializers.ReadOnlyField()

    class Meta:
        model = Room
        fields = (
            'id',
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
        )
        read_only_fields = ('id', 'price_display')