from rest_framework import serializers
from .models import Room


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for room-specific listing details.
    """
    price_display = serializers.ReadOnlyField()
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_location = serializers.CharField(source='listing.location', read_only=True)
    listing_state = serializers.CharField(source='listing.state', read_only=True)
    listing_postcode = serializers.CharField(source='listing.postcode', read_only=True)
    listing_status = serializers.CharField(source='listing.status', read_only=True)
    listing_id = serializers.IntegerField(source='listing.id', read_only=True)
    listing_slug = serializers.SlugField(source='listing.slug', read_only=True)
    posted_by = serializers.CharField(source='listing.user.full_name', read_only=True)
    poster_is_verified = serializers.BooleanField(source='listing.user.is_verified', read_only=True)
    user_id = serializers.IntegerField(source='listing.user.id', read_only=True)
    user_joined = serializers.DateTimeField(source='listing.user.date_joined', read_only=True)
    created_at = serializers.DateTimeField(source='listing.created_at', read_only=True)
    expires_at = serializers.DateTimeField(source='listing.expires_at', read_only=True)
    contact_phone = serializers.CharField(source='listing.contact_phone', read_only=True)
    contact_whatsapp = serializers.CharField(source='listing.contact_whatsapp', read_only=True)
    contact_email = serializers.EmailField(source='listing.contact_email', read_only=True)
    is_under_review = serializers.BooleanField(source='listing.is_under_review', read_only=True)
    is_reported = serializers.SerializerMethodField()
    description = serializers.CharField(source='listing.description', read_only=True)
    images = serializers.SerializerMethodField()
    is_wanted = serializers.BooleanField(source='listing.is_wanted', read_only=True)
    is_featured = serializers.BooleanField(source='listing.is_featured', read_only=True)
    view_count = serializers.SerializerMethodField()
    latitude = serializers.FloatField(source='listing.latitude', read_only=True)
    longitude = serializers.FloatField(source='listing.longitude', read_only=True)

    def get_view_count(self, obj):
        if hasattr(obj.listing, 'view_count_annotated'):
            return obj.listing.view_count_annotated
        return obj.listing.views.count()

    def get_is_reported(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if obj.listing.user == request.user or request.user.is_staff:
            return obj.listing.reports.filter(is_reviewed=False).exists()
        return False

    def get_images(self, obj):
        return [
            {
                'id': img.id,
                'url': img.image.url,
                'is_primary': img.is_primary,
            }
            for img in obj.listing.images.all()
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            data.pop('contact_email', None)
            data.pop('contact_phone', None)
            data.pop('contact_whatsapp', None)
        return data

    class Meta:
        model = Room
        fields = (
            'id',
            'listing_id',
            'listing_slug',
            'listing_title',
            'listing_location',
            'listing_state',
            'listing_postcode',
            'listing_status',
            'posted_by',
            'poster_is_verified',
            'user_id',
            'user_joined',
            'contact_phone',
            'contact_whatsapp',
            'contact_email',
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
            'street_address',
            'created_at',
            'expires_at',
            'is_under_review',
            'is_reported',
            'view_count',
            'description',
            'images',
            'is_wanted',
            'is_featured',
            'latitude',
            'longitude',
        )
        read_only_fields = (
            'id',
            'price_display',
            'listing_title',
            'listing_location',
            'listing_state',
            'listing_postcode',
            'listing_status',
            'listing_id',
            'listing_slug',
            'posted_by',
            'user_id',
            'contact_phone',
            'contact_whatsapp',
            'contact_email',
            'created_at',
            'expires_at',
            'is_under_review',
            'is_reported',
            'view_count',
            'description',
            'is_wanted',
            'is_featured',
        )