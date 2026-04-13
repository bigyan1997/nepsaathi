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
    POST /api/auth/google/
    Accepts a Google OAuth2 access token from the React frontend.
    Verifies it with Google, creates or retrieves the user,
    and returns a NepSaathi JWT token pair.
    """
    adapter_class = GoogleOAuth2Adapter
    callback_url = 'http://localhost:5173'
    client_class = OAuth2Client


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