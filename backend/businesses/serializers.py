from rest_framework import serializers
from django.db.models import Avg
from .models import Business, BusinessImage, BusinessReview
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


class BusinessImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = BusinessImage
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


class BusinessSerializer(serializers.ModelSerializer):
    """
    Serializer for Business listings.

    Security:
    - abn is write-only — never returned in API responses
    - is_verified is read-only — only admin can set this
    - owner_name is read-only — shows who registered it
    - is_owner tells React whether to show edit/delete buttons
    """
    owner_name = serializers.CharField(
        source='owner.full_name', read_only=True)
    owner_email = serializers.EmailField(
        source='owner.email', read_only=True)
    is_owner = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    images = BusinessImageSerializer(many=True, read_only=True)

    class Meta:
        model = Business
        fields = (
            'id',
            'slug',
            'owner_name',
            'owner_email',
            'is_owner',
            'business_name',
            'category',
            'description',
            'is_nepalese_owned',
            'address',
            'suburb',
            'state',
            'postcode',
            'phone',
            'whatsapp',
            'email',
            'website',
            'abn',
            'established_year',
            'operating_hours',
            'is_verified',
            'is_active',
            'images',
            'avg_rating',
            'review_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'slug',
            'is_verified',
            'owner_name',
            'owner_email',
            'is_owner',
            'images',
            'avg_rating',
            'review_count',
            'created_at',
            'updated_at',
        )
        extra_kwargs = {
            'abn': {'write_only': True},
        }

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False

    def get_avg_rating(self, obj):
        result = obj.reviews.aggregate(avg=Avg('rating'))
        avg = result['avg']
        return round(avg, 1) if avg is not None else None

    def get_review_count(self, obj):
        return obj.reviews.count()

    def to_representation(self, instance):
        """Hide owner_email from non-owners."""
        data = super().to_representation(instance)
        request = self.context.get('request')
        is_owner = (
            request and
            request.user.is_authenticated and
            instance.owner == request.user
        )
        if not is_owner:
            data.pop('owner_email', None)
        return data


class BusinessReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.full_name', read_only=True)
    is_own_review = serializers.SerializerMethodField()

    class Meta:
        model = BusinessReview
        fields = ('id', 'reviewer_name', 'is_own_review', 'rating', 'comment', 'created_at')
        read_only_fields = ('id', 'reviewer_name', 'is_own_review', 'created_at')

    def get_is_own_review(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.reviewer == request.user)
