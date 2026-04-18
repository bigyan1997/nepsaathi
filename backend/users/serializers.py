from rest_framework import serializers
from dj_rest_auth.registration.serializers import RegisterSerializer as BaseRegisterSerializer
from .models import User


class RegisterSerializer(BaseRegisterSerializer):
    first_name = serializers.CharField(required=True, max_length=50)
    last_name = serializers.CharField(required=True, max_length=50)
    username = None

    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value

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
            'updated_at',
        )
        read_only_fields = (
            'id',
            'email',
            'is_verified',
            'created_at',
            'updated_at',
            'google_avatar',
        )
        extra_kwargs = {
            'first_name': {'max_length': 50},
            'last_name': {'max_length': 50},
            'phone': {'max_length': 20},
            'bio': {'max_length': 500},
        }