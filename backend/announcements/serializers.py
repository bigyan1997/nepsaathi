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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            data.pop('contact_email', None)
            data.pop('contact_phone', None)
            data.pop('contact_whatsapp', None)
        return data

    class Meta:
        model = Announcement
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
            'price',
            'price_display',
            'condition',
            'is_free',
            'is_urgent',
            'created_at',
            'listing_status',
            'expires_at',
            'is_under_review',
            'is_reported',
            'view_count',
            'images',
            'is_featured',
        )
        read_only_fields = (
            'id',
            'price_display',
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
            'description',
            'is_featured',
        )