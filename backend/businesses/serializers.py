from rest_framework import serializers
from .models import Business


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
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'is_verified',
            'owner_name',
            'owner_email',
            'is_owner',
            'created_at',
            'updated_at',
        )
        extra_kwargs = {
            # ABN is write-only — never exposed in API response
            'abn': {'write_only': True},
        }

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False

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