from rest_framework import serializers
from .models import Listing, ListingImage, SavedListing, ListingReport
from jobs.serializers import JobSerializer
from rooms.serializers import RoomSerializer


class ListingImageSerializer(serializers.ModelSerializer):
    """
    Serializer for listing images.
    """
    class Meta:
        model = ListingImage
        fields = ('id', 'image', 'is_primary', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


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

    class Meta:
        model = Listing
        fields = (
            'id',
            'user_email',
            'user_name',
            'is_owner',
            'listing_type',
            'title',
            'description',
            'location',
            'state',
            'status',
            'contact_email',
            'contact_phone',
            'contact_whatsapp',
            'is_featured',
            'is_under_review'
            'images',
            'job_detail',
            'room_detail',
            'created_at',
            'updated_at',
            'expires_at',
        )
        read_only_fields = (
            'id',
            'created_at',
            'updated_at',
            'user_email',
            'user_name',
            'expires_at',
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


class ListingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new listing.
    User and expires_at are set automatically in the view.
    """
    class Meta:
        model = Listing
        fields = (
            'id',
            'listing_type',
            'title',
            'description',
            'location',
            'state',
            'contact_email',
            'contact_phone',
            'contact_whatsapp',
        )
        # expires_at removed — set automatically to 30 days in view


class SavedListingSerializer(serializers.ModelSerializer):
    listing_title = serializers.CharField(source='listing.title', read_only=True)
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