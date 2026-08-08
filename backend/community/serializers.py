from rest_framework import serializers
from .models import ReverseRequest, ServiceListing


class ReverseRequestSerializer(serializers.ModelSerializer):
    poster_name  = serializers.SerializerMethodField()
    poster_id    = serializers.SerializerMethodField()

    class Meta:
        model  = ReverseRequest
        fields = ['id', 'poster_name', 'poster_id', 'title', 'body',
                  'category', 'state', 'budget', 'contact', 'is_active', 'created_at']
        read_only_fields = ['id', 'poster_name', 'poster_id', 'is_active', 'created_at']

    def get_poster_name(self, obj):
        return obj.user.full_name or obj.user.email

    def get_poster_id(self, obj):
        return obj.user.id


class ServiceListingSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    provider_id   = serializers.SerializerMethodField()

    class Meta:
        model  = ServiceListing
        fields = ['id', 'provider_name', 'provider_id', 'title', 'category',
                  'description', 'rate', 'rate_type', 'location', 'state',
                  'is_active', 'created_at']
        read_only_fields = ['id', 'provider_name', 'provider_id', 'is_active', 'created_at']

    def get_provider_name(self, obj):
        return obj.user.full_name or obj.user.email

    def get_provider_id(self, obj):
        return obj.user.id
