from rest_framework import generics, permissions, status
from users.throttles import LoginRateThrottle, RegisterRateThrottle, PasswordResetThrottle
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
                from django.utils import timezone
                from datetime import timedelta
                is_new_user = (timezone.now() - user.date_joined) < timedelta(seconds=30)
                if picture_url and not user.google_avatar:
                    user.google_avatar = picture_url
                    user.save()
                if is_new_user:
                    from core.emails import send_welcome_email
                    import threading
                    threading.Thread(target=send_welcome_email, args=(user,)).start()
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
                from listings.models import Listing
                listings = Listing.objects.filter(user=user).prefetch_related('images')
                cloudinary_errors = []
                for listing in listings:
                    for image in listing.images.all():
                        try:
                            image.delete()
                        except Exception as e:
                            cloudinary_errors.append(str(e))
                    listing.delete()
                if cloudinary_errors:
                    import logging
                    logging.getLogger(__name__).warning(
                        'Cloudinary cleanup errors during account deletion for user %s: %s',
                        user.id, cloudinary_errors
                    )
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

class ContactView(APIView):
    """
    POST /api/users/contact/
    Send contact form email to hello@nepsaathi.com
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        subject = request.data.get('subject', 'NepSaathi Enquiry').strip()
        message = request.data.get('message', '').strip()

        import re
        if not name or not email or not message:
            return Response(
                {'detail': 'Name, email and message are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
            return Response(
                {'detail': 'Please enter a valid email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from core.emails import send_contact_email
            send_contact_email(name, email, subject, message)
            return Response({'detail': 'Message sent successfully!'})
        except Exception as e:
            return Response(
                {'detail': 'Failed to send message. Please email us directly.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ThrottledLoginView(APIView):
    """
    POST /api/auth/login/
    Login with email and password — rate limited to 5/minute.
    After 5 failed attempts per IP, returns 429 Too Many Requests.
    """
    throttle_classes = [LoginRateThrottle]
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from dj_rest_auth.views import LoginView
        from django.core.cache import cache

        # Track failed attempts per IP
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if ip:
            ip = ip.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        cache_key = f'login_attempts_{ip}'
        attempts = cache.get(cache_key, 0)

        if attempts >= 5:
            return Response(
                {'detail': 'Too many login attempts. Please try again in 5 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        response = LoginView.as_view()(request._request, *args, **kwargs)

        # If login failed (not 200), increment counter
        if response.status_code != 200:
            cache.set(cache_key, attempts + 1, timeout=300)  # 5 minute lockout

        # If login succeeded, clear the counter
        if response.status_code == 200:
            cache.delete(cache_key)

        return response


class ThrottledRegisterView(APIView):
    """
    POST /api/auth/registration/
    Register new user — rate limited to 3/minute.
    """
    throttle_classes = [RegisterRateThrottle]
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from dj_rest_auth.registration.views import RegisterView
        return RegisterView.as_view()(request._request, *args, **kwargs)

class ThrottledPasswordResetView(APIView):
    """
    POST /api/auth/password/reset/
    Password reset — rate limited to 3/hour.
    """
    throttle_classes = [PasswordResetThrottle]
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        from dj_rest_auth.views import PasswordResetView
        return PasswordResetView.as_view()(request._request, *args, **kwargs)
