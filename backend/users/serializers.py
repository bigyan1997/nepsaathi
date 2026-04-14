from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from .models import User


class RegisterSerializer(BaseRegisterSerializer):
    """
    Custom registration serializer for NepSaathi.
    Email only — username completely removed.
    """
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)

    # Remove username field completely
    username = None

    def get_cleaned_data(self):
        return {
            'email': self.validated_data.get('email', ''),
            'password1': self.validated_data.get('password1', ''),
            'first_name': self.validated_data.get('first_name', ''),
            'last_name': self.validated_data.get('last_name', ''),
        }

    def save(self, request):
        user = super().save(request)
        user.first_name = self.validated_data.get('first_name', '')
        user.last_name = self.validated_data.get('last_name', '')
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for reading and updating NepSaathi user profiles.
    """
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
            'google_avatar',
            'phone',
            'location',
            'bio',
            'is_verified',
            'created_at',
        )
        read_only_fields = ('id', 'email', 'is_verified', 'created_at', 'google_avatar',)