from rest_framework import generics, permissions, status
from users.throttles import LoginRateThrottle, RegisterRateThrottle, PasswordResetThrottle, ContactRateThrottle
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from decouple import config
from .serializers import UserSerializer, PublicProfileSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()

# Pre-computed hash used for constant-time dummy check on non-existent email logins
# (prevents timing-based email enumeration — bcrypt is slow, absence should cost the same)
_DUMMY_HASH = make_password('nepsaathi-dummy-constant-time')

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
                is_new_user = (timezone.now() - user.date_joined) < timedelta(seconds=30)  # 30s catches OAuth users created moments before this signal fires
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
        # Refresh token may arrive in the request body (Google OAuth) or in the
        # httpOnly cookie 'nepsaathi-refresh' (email/password login).
        refresh_token = (
            request.data.get('refresh')
            or request.COOKIES.get('nepsaathi-refresh', '')
        )
        if not refresh_token:
            # Nothing to blacklist — still a successful logout for the client
            return Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass  # Already invalid or expired — treat as logged out
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)
    
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
    throttle_classes = [ContactRateThrottle]

    def post(self, request):
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip()
        subject = request.data.get('subject', 'NepSaathi Enquiry').strip()
        message = request.data.get('message', '').strip()

        if not name or not email or not message:
            return Response(
                {'detail': 'Name, email and message are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if len(name) > 100:
            return Response({'detail': 'Name cannot exceed 100 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(subject) > 200:
            return Response({'detail': 'Subject cannot exceed 200 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(message) > 5000:
            return Response({'detail': 'Message cannot exceed 5000 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_email(email)
        except DjangoValidationError:
            return Response(
                {'detail': 'Please enter a valid email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from core.emails import send_contact_email
            send_contact_email(name, email, subject, message)
            return Response({'detail': 'Message sent successfully!'})
        except Exception:
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

        # Track failed attempts per IP.
        # Take the rightmost entry from X-Forwarded-For — Railway (1 trusted proxy)
        # appends the real client IP there, so the rightmost cannot be spoofed.
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if ip:
            ip = ip.split(',')[-1].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')

        cache_key = f'login_attempts_{ip}'
        attempts = cache.get(cache_key, 0)

        if attempts >= 5:
            return Response(
                {'detail': 'Too many login attempts. Please try again in 5 minutes.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )

        # Per-email rate limit — catches distributed/proxy attacks targeting one account
        try:
            import json as _json_email
            _email_raw = _json_email.loads(request._request.body or b'{}')
            _email_val = str(_email_raw.get('email', '')).strip().lower()
        except Exception:
            _email_val = ''
        if _email_val:
            import hashlib
            email_hash = hashlib.sha256(_email_val.encode()).hexdigest()[:16]
            email_cache_key = f'login_attempts_email_{email_hash}'
            email_attempts = cache.get(email_cache_key, 0)
            if email_attempts >= 10:
                return Response(
                    {'detail': 'Too many login attempts. Please try again in 5 minutes.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS
                )

        # Use request._request.body (Django's caching property) not request.data.
        # DRF's request.data calls stream.read() which exhausts the WSGI stream
        # without caching, breaking the inner LoginView call below.
        # .body caches in _body so subsequent read() calls return from cache.
        try:
            import json as _json
            _raw = _json.loads(request._request.body or b'{}')
            email = str(_raw.get('email', '')).strip()
        except Exception:
            email = ''
        if email and not User.objects.filter(email__iexact=email).exists():
            # Constant-time response: run a real bcrypt check so timing matches
            # the existing-email path and callers can't enumerate registered emails.
            check_password('wrong', _DUMMY_HASH)
            try:
                cache.incr(cache_key)
            except ValueError:
                cache.set(cache_key, 1, timeout=300)
            return Response(
                {'non_field_errors': ['Invalid credentials.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response = LoginView.as_view()(request._request, *args, **kwargs)

        if response.status_code != 200:
            # Atomic increment — avoids race condition under burst requests
            try:
                cache.incr(cache_key)
            except ValueError:
                cache.set(cache_key, 1, timeout=300)
            if _email_val:
                try:
                    cache.incr(email_cache_key)
                except ValueError:
                    cache.set(email_cache_key, 1, timeout=300)
            # Replace the generic allauth credential error with a clearer message.
            # Pass through other errors (e.g. unverified email) unchanged.
            resp_data = getattr(response, 'data', {})
            errors = resp_data.get('non_field_errors', [])
            if errors and errors[0] == 'Unable to log in with provided credentials.':
                return Response(
                    {'non_field_errors': ['Invalid credentials.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return response
        else:
            cache.delete(cache_key)
            if _email_val:
                cache.delete(email_cache_key)

        return response


class ThrottledRegisterView(APIView):
    """
    POST /api/auth/registration/
    Register new user — rate limited to 3/minute.
    Accepts optional `ref_code` in body to credit the referrer.
    """
    throttle_classes = [RegisterRateThrottle]
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        import json as _json
        from dj_rest_auth.registration.views import RegisterView

        try:
            raw = _json.loads(request._request.body or b'{}')
            email = str(raw.get('email', '')).strip().lower()
            ref_code = str(raw.get('ref_code', '')).strip()
        except Exception:
            email = ''
            ref_code = ''

        response = RegisterView.as_view()(request._request, *args, **kwargs)

        if response.status_code == 201 and email:
            try:
                new_user = User.objects.get(email__iexact=email)
                new_user.award_points(10, 'signup', 'Welcome bonus for joining NepSaathi!')
                if ref_code:
                    referrer = User.objects.filter(referral_code=ref_code).exclude(pk=new_user.pk).first()
                    if referrer:
                        new_user.referred_by = referrer
                        new_user.save(update_fields=['referred_by'])
                        referrer.award_points(25, 'referral', f'Referral bonus — {new_user.full_name or email} joined!')
            except Exception:
                pass

        return response

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


class PushSubscribeView(APIView):
    """
    POST   /api/users/push/subscribe/   — register a push subscription
    DELETE /api/users/push/subscribe/   — remove a push subscription
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get('endpoint', '').strip()
        p256dh = request.data.get('p256dh', '').strip()
        auth = request.data.get('auth', '').strip()

        if not endpoint or not p256dh or not auth:
            return Response(
                {'detail': 'endpoint, p256dh and auth are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from users.models import PushSubscription
        # Prevent one user from hijacking another user's push endpoint and intercepting their notifications
        existing = PushSubscription.objects.filter(endpoint=endpoint).exclude(user=request.user).first()
        if existing:
            return Response({'detail': 'Endpoint already registered.'}, status=status.HTTP_400_BAD_REQUEST)
        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={'user': request.user, 'p256dh': p256dh, 'auth': auth},
        )
        return Response({'detail': 'Subscribed.'}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        endpoint = request.data.get('endpoint', '').strip()
        if not endpoint:
            return Response(
                {'detail': 'endpoint is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        from users.models import PushSubscription
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response({'detail': 'Unsubscribed.'}, status=status.HTTP_200_OK)


class PushTestView(APIView):
    """
    POST /api/users/push/test/ — send a test push and return real per-subscription results.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import json
        from django.conf import settings
        from users.models import PushSubscription

        if not settings.VAPID_PRIVATE_KEY:
            return Response({'ok': False, 'error': 'VAPID_PRIVATE_KEY not set on server'})

        subs = list(PushSubscription.objects.filter(user=request.user))
        if not subs:
            return Response({'ok': False, 'error': 'No push subscriptions saved for your account'})

        try:
            from pywebpush import webpush, WebPushException
        except ImportError:
            return Response({'ok': False, 'error': 'pywebpush not installed on server'})

        results = []
        payload = json.dumps({'title': 'Test notification', 'body': 'Push is working!', 'url': '/messages'})

        for sub in subs:
            try:
                webpush(
                    subscription_info={'endpoint': sub.endpoint, 'keys': {'p256dh': sub.p256dh, 'auth': sub.auth}},
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}'},
                    ttl=60,
                    headers={'urgency': 'high'},
                    timeout=10,
                )
                results.append({'endpoint': sub.endpoint[:60], 'ok': True})
            except WebPushException as e:
                status = e.response.status_code if e.response is not None else None
                body = ''
                try:
                    body = e.response.text if e.response is not None else ''
                except Exception:
                    pass
                results.append({'endpoint': sub.endpoint[:60], 'ok': False, 'status': status, 'error': body or str(e)})
            except Exception as e:
                results.append({'endpoint': sub.endpoint[:60], 'ok': False, 'error': str(e)})

        all_ok = all(r['ok'] for r in results)
        return Response({'ok': all_ok, 'results': results})


class PublicProfileView(generics.RetrieveAPIView):
    """
    GET /api/users/<id>/public/
    Returns a user's public profile and their active listing count.
    No email or phone exposed.
    """
    permission_classes = (permissions.AllowAny,)
    serializer_class = PublicProfileSerializer
    queryset = User.objects.filter(is_active=True, is_banned=False)
    lookup_field = 'id'


class MyPointsView(APIView):
    """GET /api/users/points/ — current user's points balance and recent history"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from .models import PointEvent
        user = request.user
        events = PointEvent.objects.filter(user=user)[:20]
        return Response({
            'points': user.points,
            'referral_code': user.referral_code,
            'events': [
                {
                    'event_type': e.event_type,
                    'delta': e.delta,
                    'description': e.description,
                    'created_at': e.created_at,
                }
                for e in events
            ],
        })


class UserReviewListCreateView(APIView):
    """
    GET  /api/users/<id>/reviews/ — list reviews for a user
    POST /api/users/<id>/reviews/ — leave a review (must have had a conversation with them)
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, id):
        from .models import UserReview
        reviews = UserReview.objects.filter(reviewed_user_id=id).select_related('reviewer')
        data = [
            {
                'id': r.id,
                'reviewer_id': r.reviewer_id,
                'reviewer_name': r.reviewer.full_name or r.reviewer.email.split('@')[0],
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at,
                'is_own': request.user.is_authenticated and r.reviewer_id == request.user.id,
            }
            for r in reviews
        ]
        avg = round(sum(r['rating'] for r in data) / len(data), 1) if data else 0
        return Response({'reviews': data, 'avg_rating': avg, 'count': len(data)})

    def post(self, request, id):
        from .models import UserReview
        from messaging.models import Conversation

        if request.user.id == id:
            return Response({'detail': 'You cannot review yourself.'}, status=400)

        try:
            reviewed_user = User.objects.get(pk=id, is_active=True)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=404)

        # Must have had at least one conversation with this person
        has_conversation = Conversation.objects.filter(participants=request.user).filter(participants=reviewed_user).exists()
        if not has_conversation:
            return Response({'detail': 'You can only review someone you have messaged.'}, status=403)

        if UserReview.objects.filter(reviewer=request.user, reviewed_user=reviewed_user).exists():
            return Response({'detail': 'You have already reviewed this person.'}, status=400)

        rating = request.data.get('rating')
        comment = request.data.get('comment', '').strip()

        if not rating or not isinstance(rating, int) or not (1 <= rating <= 5):
            return Response({'detail': 'Rating must be between 1 and 5.'}, status=400)

        review = UserReview.objects.create(
            reviewer=request.user,
            reviewed_user=reviewed_user,
            rating=rating,
            comment=comment[:1000],
        )
        return Response({
            'id': review.id,
            'reviewer_name': request.user.full_name or request.user.email.split('@')[0],
            'rating': review.rating,
            'comment': review.comment,
            'created_at': review.created_at,
            'is_own': True,
        }, status=201)


class UserReviewDeleteView(APIView):
    """DELETE /api/users/<id>/reviews/<review_id>/ — delete own review"""
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, id, review_id):
        from .models import UserReview
        try:
            review = UserReview.objects.get(pk=review_id, reviewer=request.user, reviewed_user_id=id)
        except UserReview.DoesNotExist:
            return Response({'detail': 'Review not found.'}, status=404)
        review.delete()
        return Response(status=204)
