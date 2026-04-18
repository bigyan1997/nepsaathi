from rest_framework import serializers
from .models import Event


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for event-specific listing details.
    Includes all listing fields needed for display.
    """
    ticket_display = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    listing_title = serializers.CharField(
        source='listing.title', read_only=True)
    listing_location = serializers.CharField(
        source='listing.location', read_only=True)
    listing_state = serializers.CharField(
        source='listing.state', read_only=True)
    listing_id = serializers.IntegerField(
        source='listing.id', read_only=True)
    posted_by = serializers.CharField(
        source='listing.user.full_name', read_only=True)
    description = serializers.CharField(
        source='listing.description', read_only=True)
    contact_phone = serializers.CharField(
        source='listing.contact_phone', read_only=True)
    contact_whatsapp = serializers.CharField(
        source='listing.contact_whatsapp', read_only=True)
    contact_email = serializers.EmailField(
        source='listing.contact_email', read_only=True)
    created_at = serializers.DateTimeField(
        source='listing.created_at', read_only=True)
    listing_status = serializers.CharField(source='listing.status', read_only=True)
    expires_at = serializers.DateTimeField(source='listing.expires_at', read_only=True) 
    is_under_review = serializers.BooleanField(source='listing.is_under_review', read_only=True)
    view_count = serializers.IntegerField(source='listing.views.count', read_only=True)
    description = serializers.CharField(source='listing.description', read_only=True)
    images = serializers.SerializerMethodField()

    def get_images(self, obj):
        return [
            {
                'id': img.id,
                'url': img.image.url,
                'is_primary': img.is_primary,
            }
            for img in obj.listing.images.all()
        ]


    class Meta:
        model = Event
        fields = (
            'id',
            'listing_id',
            'listing_title',
            'listing_location',
            'listing_state',
            'posted_by',
            'description',
            'contact_phone',
            'contact_whatsapp',
            'contact_email',
            'category',
            'event_date',
            'event_end_date',
            'venue',
            'organiser',
            'is_free',
            'ticket_price',
            'ticket_display',
            'max_attendees',
            'is_online',
            'event_url',
            'is_upcoming',
            'created_at',
            'listing_status',
            'is_under_review',
            'expires_at',
            'view_count',
            'description',
            'images',
        )
        read_only_fields = (
            'id',
            'ticket_display',
            'is_upcoming',
            'listing_title',
            'listing_location',
            'listing_state',
            'listing_id',
            'posted_by',
            'description',
            'contact_phone',
            'contact_whatsapp',
            'contact_email',
            'created_at',
            'listing_status',
            'expires_at',
            'is_under_review',
            'view_count',
            'description',
        )