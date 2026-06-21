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
    listing_slug = serializers.SlugField(source='listing.slug', read_only=True)
    posted_by = serializers.CharField(
        source='listing.user.full_name', read_only=True)
    poster_is_verified = serializers.BooleanField(source='listing.user.is_verified', read_only=True)
    user_id = serializers.IntegerField(source='listing.user.id', read_only=True)
    user_joined = serializers.DateTimeField(source='listing.user.date_joined', read_only=True)
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
    is_reported = serializers.SerializerMethodField()
    is_featured = serializers.BooleanField(source='listing.is_featured', read_only=True)
    images = serializers.SerializerMethodField()
    view_count = serializers.SerializerMethodField()
    rsvp_count = serializers.SerializerMethodField()
    spots_left = serializers.SerializerMethodField()
    user_has_rsvp = serializers.SerializerMethodField()

    def get_rsvp_count(self, obj):
        if hasattr(obj, 'rsvp_count_annotated'):
            return obj.rsvp_count_annotated
        return obj.rsvps.count()

    def get_spots_left(self, obj):
        if obj.max_attendees is None:
            return None
        rsvp_count = self.get_rsvp_count(obj)
        return max(0, obj.max_attendees - rsvp_count)

    def get_user_has_rsvp(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.rsvps.filter(user=request.user).exists()

    def get_view_count(self, obj):
        if hasattr(obj.listing, 'view_count_annotated'):
            return obj.listing.view_count_annotated
        return obj.listing.views.count()

    def get_is_reported(self, obj):
        return obj.listing.reports.filter(is_reviewed=False).exists()

    def get_images(self, obj):
        return [
            {
                'id': img.id,
                'url': img.image.url,
                'is_primary': img.is_primary,
            }
            for img in obj.listing.images.all()
        ]

    def validate_event_date(self, value):
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError("Event date must be in the future.")
        return value

    def validate(self, attrs):
        event_date = attrs.get('event_date') or getattr(self.instance, 'event_date', None)
        event_end_date = attrs.get('event_end_date')
        if event_end_date and event_date and event_end_date <= event_date:
            raise serializers.ValidationError(
                {'event_end_date': 'End date must be after the start date.'}
            )
        return attrs


    class Meta:
        model = Event
        fields = (
            'id',
            'listing_id',
            'listing_slug',
            'listing_title',
            'listing_location',
            'listing_state',
            'posted_by',
            'poster_is_verified',
            'user_id',
            'user_joined',
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
            'is_reported',
            'expires_at',
            'view_count',
            'images',
            'rsvp_count',
            'spots_left',
            'user_has_rsvp',
            'is_featured',
        )
        read_only_fields = (
            'id',
            'ticket_display',
            'is_upcoming',
            'listing_title',
            'listing_location',
            'listing_state',
            'listing_id',
            'listing_slug',
            'posted_by',
            'description',
            'contact_phone',
            'contact_whatsapp',
            'contact_email',
            'created_at',
            'listing_status',
            'expires_at',
            'is_under_review',
            'is_reported',
            'view_count',
            'rsvp_count',
            'spots_left',
            'user_has_rsvp',
            'is_featured',
        )