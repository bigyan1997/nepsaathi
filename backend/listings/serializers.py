from rest_framework import serializers
from .models import Listing, ListingImage
from jobs.serializers import JobSerializer
from rooms.serializers import RoomSerializer


class ListingImageSerializer(serializers.ModelSerializer):
    """
    Serializer for listing images.
    Converts image model to JSON for the API.
    """
    class Meta:
        model = ListingImage
        fields = ('id', 'image', 'is_primary', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_at')


class ListingSerializer(serializers.ModelSerializer):
    """
    Serializer for the base Listing model.

    - images: all images attached to this listing
    - job_detail: job specific fields (only if listing_type is job)
    - room_detail: room specific fields (only if listing_type is room)
    - user_email: read only, shows who posted it
    - is_owner: tells React if the logged in user owns this listing
    """
    images = ListingImageSerializer(many=True, read_only=True)
    job_detail = JobSerializer(read_only=True)
    room_detail = RoomSerializer(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    is_owner = serializers.SerializerMethodField()

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
            'images',
            'job_detail',
            'room_detail',
            'created_at',
            'updated_at',
            'expires_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'user_email', 'user_name')

    def get_is_owner(self, obj):
        """
        Returns True if the logged in user owns this listing.
        React uses this to show/hide edit and delete buttons.
        """
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False


class ListingCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new listing.
    User is set automatically from the request — not from the payload.
    """
    class Meta:
        model = Listing
        fields = (
            'listing_type',
            'title',
            'description',
            'location',
            'state',
            'contact_email',
            'contact_phone',
            'contact_whatsapp',
            'expires_at',
        )

    def create(self, validated_data):
        # Automatically assign the logged in user as the owner
        user = self.context['request'].user
        listing = Listing.objects.create(user=user, **validated_data)
        return listing