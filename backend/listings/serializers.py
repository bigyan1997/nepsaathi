from rest_framework import serializers
from .models import Listing, ListingImage, SavedListing, ListingReport, SavedSearch
from jobs.serializers import JobSerializer
from rooms.serializers import RoomSerializer
import cloudinary.utils


def _cloudinary_url(public_id, width):
    url, _ = cloudinary.utils.cloudinary_url(
        public_id,
        fetch_format='auto',
        quality='auto',
        width=width,
        crop='limit',
    )
    return url


class ListingImageSerializer(serializers.ModelSerializer):
    """
    Serializer for listing images.
    Returns optimized Cloudinary URLs (f_auto, q_auto) with two sizes:
      - image: 800px wide for detail views
      - thumbnail: 400px wide for list/card views
    """
    image = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = ListingImage
        fields = ('id', 'image', 'thumbnail', 'is_primary', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')

    def get_image(self, obj):
        try:
            return _cloudinary_url(obj.image.public_id, 800)
        except Exception:
            return str(obj.image)

    def get_thumbnail(self, obj):
        try:
            return _cloudinary_url(obj.image.public_id, 400)
        except Exception:
            return str(obj.image)


class ListingSerializer(serializers.ModelSerializer):
    """
    Serializer for the base Listing model.
    """
    images = ListingImageSerializer(many=True, read_only=True)
    job_detail = serializers.SerializerMethodField()
    room_detail = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    is_owner = serializers.SerializerMethodField()
    expires_at = serializers.DateTimeField(read_only=True)
    view_count = serializers.SerializerMethodField()
    is_reported = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = (
            'id',
            'slug',
            'user_email',
            'user_name',
            'is_owner',
            'listing_type',
            'title',
            'description',
            'location',
            'state',
            'postcode',
            'status',
            'contact_email',
            'contact_phone',
            'contact_whatsapp',
            'is_featured',
            'is_under_review',
            'is_reported',
            'renewal_blocked',
            'images',
            'job_detail',
            'room_detail',
            'created_at',
            'updated_at',
            'expires_at',
            'view_count',
            'is_wanted',
            'tags',
        )
        read_only_fields = (
            'id',
            'slug',
            'created_at',
            'updated_at',
            'user_email',
            'user_name',
            'expires_at',
            'listing_type',
            'is_featured',
            'is_under_review',
            'is_reported',
            'renewal_blocked',
        )

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False

    def get_job_detail(self, obj):
        """Only serialize job detail if listing is a job."""
        if obj.listing_type == 'job' and hasattr(obj, 'job_detail'):
            return JobSerializer(obj.job_detail).data
        return None

    def get_room_detail(self, obj):
        """Only serialize room detail if listing is a room."""
        if obj.listing_type == 'room' and hasattr(obj, 'room_detail'):
            return RoomSerializer(obj.room_detail).data
        return None
    
    def get_view_count(self, obj):
        # Use annotated value if available to avoid N+1
        if hasattr(obj, 'view_count_annotated'):
            return obj.view_count_annotated
        return obj.views.count()

    def get_is_reported(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        if request.user == obj.user or request.user.is_staff:
            return obj.reports.filter(is_reviewed=False).exists()
        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            data.pop('contact_email', None)
            data.pop('contact_phone', None)
            data.pop('contact_whatsapp', None)
            data.pop('user_email', None)
        elif instance.user != request.user:
            data.pop('user_email', None)
        return data


class ListingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new listing.
    User and expires_at are set automatically in the view.
    """
    class Meta:
        model = Listing
        fields = (
            'id',
            'slug',
            'listing_type',
            'title',
            'description',
            'location',
            'state',
            'postcode',
            'contact_email',
            'contact_phone',
            'contact_whatsapp',
            'is_wanted',
            'tags',
        )
        read_only_fields = ('id', 'slug')
        extra_kwargs = {
            'listing_type': {'required': True},
            'title': {'required': True},
            'description': {'required': True},
            'location': {'required': True},
        }


class SavedListingSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_slug = serializers.SlugField(source='listing.slug', read_only=True)
    listing_type = serializers.CharField(source='listing.listing_type', read_only=True)
    listing_location = serializers.CharField(source='listing.location', read_only=True)
    listing_state = serializers.CharField(source='listing.state', read_only=True)
    listing_status = serializers.CharField(source='listing.status', read_only=True)

    class Meta:
        model = SavedListing
        fields = (
            'id',
            'listing',
            'listing_title',
            'listing_slug',
            'listing_type',
            'listing_location',
            'listing_state',
            'listing_status',
            'saved_at',
        )
        read_only_fields = ('id', 'saved_at')


class ListingReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingReport
        fields = ('id', 'listing', 'reason', 'details', 'created_at')
        read_only_fields = ('id', 'created_at')


class SavedSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedSearch
        fields = ('id', 'label', 'listing_type', 'filters', 'is_active', 'last_notified', 'created_at')
        read_only_fields = ('id', 'last_notified', 'created_at')

    def validate_listing_type(self, value):
        allowed = {'job', 'room', 'event', 'notice', 'business'}
        if value not in allowed:
            raise serializers.ValidationError(f'listing_type must be one of: {", ".join(sorted(allowed))}')
        return value