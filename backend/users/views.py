from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from .serializers import UserSerializer


class GoogleLoginView(SocialLoginView):
    """
    POST /api/users/auth/google/
    Accepts Google access token, verifies with Google,
    creates or retrieves user, saves profile picture,
    returns NepSaathi JWT token pair.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:5173'
    client_class = OAuth2Client

    def get_response(self):
        response = super().get_response()

        # After Google login save the profile picture URL
        try:
            user = self.user
            social_account = user.socialaccount_set.filter(
                provider='google'
            ).first()

            if social_account:
                extra_data = social_account.extra_data
                picture_url = extra_data.get('picture', '')

                # Save Google avatar URL to user profile
                if picture_url and not user.avatar:
                    user.google_avatar = picture_url
                    user.save()
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
            refresh_token = request.data['refresh']
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