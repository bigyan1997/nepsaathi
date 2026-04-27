from rest_framework import serializers
from django.db.models import Avg
from .models import Business, BusinessReview


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

    class Meta:
        model = Business
        fields = (
            'id',
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
            'avg_rating',
            'review_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'is_verified',
            'owner_name',
            'owner_email',
            'is_owner',
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
