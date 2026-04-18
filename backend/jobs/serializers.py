from rest_framework import serializers
from .models import Job


class JobSerializer(serializers.ModelSerializer):
    """
    Serializer for job-specific listing details.
    """
    salary_display = serializers.ReadOnlyField()
    listing_title = serializers.CharField(source='listing.title', read_only=True)
    listing_location = serializers.CharField(source='listing.location', read_only=True)
    listing_state = serializers.CharField(source='listing.state', read_only=True)
    listing_status = serializers.CharField(source='listing.status', read_only=True)
    listing_id = serializers.IntegerField(source='listing.id', read_only=True)
    contact_phone = serializers.CharField(source='listing.contact_phone', read_only=True)
    contact_whatsapp = serializers.CharField(source='listing.contact_whatsapp', read_only=True)
    contact_email = serializers.EmailField(source='listing.contact_email', read_only=True)
    posted_by = serializers.CharField(source='listing.user.full_name', read_only=True)
    created_at = serializers.DateTimeField(source='listing.created_at', read_only=True)
    expires_at = serializers.DateTimeField(source='listing.expires_at', read_only=True)
    is_featured = serializers.BooleanField(source='listing.is_featured', read_only=True)
    is_under_review = serializers.BooleanField(source='listing.is_under_review', read_only=True)

    class Meta:
        model = Job
        fields = (
            'id',
            'listing_id',
            'listing_title',
            'listing_location',
            'listing_state',
            'listing_status',
            'posted_by',
            'contact_phone',
            'contact_whatsapp',
            'contact_email',
            'company_name',
            'job_type',
            'salary',
            'salary_type',
            'salary_display',
            'experience_required',
            'qualifications',
            'is_urgent',
            'created_at',
            'expires_at',
            'is_featured',
            'is_under_review',
        )
        read_only_fields = (
            'id',
            'salary_display',
            'listing_title',
            'listing_location',
            'listing_state',
            'listing_status',
            'listing_id',
            'posted_by',
            'contact_phone',
            'contact_whatsapp',
            'contact_email',
            'created_at',
            'expires_at',
            'is_featured',
            'is_under_review',
        )