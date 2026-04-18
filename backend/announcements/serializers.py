from rest_framework import serializers
from .models import Announcement


class AnnouncementSerializer(serializers.ModelSerializer):
    """
    Serializer for announcement-specific listing details.

    price_display    — read only formatted string e.g. $50.00 or Free
    listing_title    — read only, parent listing title
    listing_location — read only, where the announcement is from
    """
    price_display = serializers.ReadOnlyField()
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
        model = Announcement
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
            'price',
            'price_display',
            'condition',
            'is_free',
            'is_urgent',
            'created_at',
            'listing_status',
            'expires_at',
            'is_under_review',
            'view_count',
            'description',
            'images',
        )
        read_only_fields = (
            'id',
            'price_display',
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