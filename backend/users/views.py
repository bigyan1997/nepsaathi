from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from decouple import config
from .serializers import UserSerializer

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')


class GoogleLoginView(SocialLoginView):
    """
    POST /api/users/auth/google/
    Accepts Google access token, verifies with Google,
    creates or retrieves user, saves profile picture,
    returns NepSaathi JWT token pair.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = FRONTEND_URL
    client_class = OAuth2Client

    def get_response(self):
        response = super().get_response()
        try:
            user = self.user
            social_account = user.socialaccount_set.filter(provider='google').first()
            if social_account:
                extra_data = social_account.extra_data
                picture_url = extra_data.get('picture', '')
                if picture_url and not user.google_avatar:
                    user.google_avatar = picture_url
                    user.save()
                    # Send welcome email only on first Google login
                    from core.emails import send_welcome_email
                    send_welcome_email(user)
        except Exception:
            pass
        return response


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/users/profile/ — retrieve logged in user profile
    PATCH /api/users/profile/ — update logged in user profile
    """
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token to log the user out securely.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'detail': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'detail': 'Successfully logged out.'},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {'detail': 'Invalid token.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
class DeleteAccountView(APIView):
        """
        DELETE /api/users/delete-account/
        Permanently deletes the logged in user's account.
        """
        permission_classes = (permissions.IsAuthenticated,)

        def delete(self, request):
            user = request.user
            try:
                # Soft delete all listings
                from listings.models import Listing
                Listing.objects.filter(user=user).update(status='deleted')
                # Delete user
                user.delete()
                return Response(
                    {'detail': 'Your account has been permanently deleted.'},
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response(
                    {'detail': 'Failed to delete account. Please contact support.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )