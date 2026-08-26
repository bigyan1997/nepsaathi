import re
import hashlib
import logging

logger = logging.getLogger(__name__)
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, ListingImage, ListingReport, SavedListing, ListingView, SavedSearch
from .serializers import ListingReportSerializer, ListingSerializer, ListingCreateSerializer, ListingImageSerializer, SavedListingSerializer, SavedSearchSerializer
from .throttles import ListingCreateThrottle, ListingViewThrottle
from rest_framework.throttling import ScopedRateThrottle
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from rest_framework.exceptions import ValidationError
from businesses.models import Business
from django.db.models import Count, Case, When, IntegerField, Value
from core.emails import send_spam_detected_email


from decouple import config as _env_config
_N8N_WEBHOOK = _env_config('N8N_WEBHOOK_URL', default='')
_LISTING_TYPE_PATH = {
    'job': 'jobs', 'room': 'rooms', 'event': 'events',
    'notice': 'notices', 'business': 'businesses',
}

def _notify_n8n(listing):
    if not _N8N_WEBHOOK:
        return
    import json, time, urllib.request
    try:
        time.sleep(60)  # wait for images to finish uploading
        from .models import Listing as _Listing
        fresh = _Listing.objects.prefetch_related('images').get(id=listing.id)
        path = _LISTING_TYPE_PATH.get(fresh.listing_type, fresh.listing_type + 's')
        first_image = fresh.images.first()
        image_url = first_image.image.url if first_image else None
        # Make relative image URLs absolute
        if image_url and image_url.startswith('/'):
            image_url = f"https://nepsaathi-production.up.railway.app{image_url}"
        payload = json.dumps({
            "title": fresh.title,
            "category": fresh.listing_type,
            "location": f"{fresh.location}, {fresh.state}",
            "url": f"https://www.nepsaathi.com/{path}/{fresh.slug}",
            "image_url": image_url,
            "description": fresh.description or "",
            "tags": fresh.tags or [],
        }).encode()
        import os
        headers = {"Content-Type": "application/json"}
        secret = os.environ.get('N8N_WEBHOOK_SECRET', '')
        if secret:
            headers['X-Webhook-Secret'] = secret
        req = urllib.request.Request(
            _N8N_WEBHOOK, data=payload,
            headers=headers, method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def _normalize_phone(phone):
    """Strip all non-digit characters so '0412 345 678' and '+61412345678' compare equal."""
    return re.sub(r'\D', '', phone or '')


def _normalize_text(text):
    """Lowercase, strip punctuation, return word list."""
    return re.sub(r'[^a-z0-9\s]', '', (text or '').lower()).split()


def _word_overlap(words_a, words_b):
    """Jaccard-style overlap: intersection / max(len_a, len_b)."""
    set_a, set_b = set(words_a), set(words_b)
    if not set_a or not set_b:
        return 0.0
    return len(set_a & set_b) / max(len(set_a), len(set_b))


def _geocode_listing(listing):
    """Geocode listing suburb+state via Nominatim and save lat/lng (runs in background thread)."""
    import urllib.request
    import urllib.parse
    import json
    query = f"{listing.location}, {listing.state}, Australia"
    url = (
        "https://nominatim.openstreetmap.org/search?"
        + urllib.parse.urlencode({'q': query, 'format': 'json', 'limit': 1, 'countrycodes': 'au'})
    )
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'NepSaathi/1.0 (nepsaathi.com)'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
        if data:
            Listing.objects.filter(pk=listing.pk).update(
                latitude=float(data[0]['lat']),
                longitude=float(data[0]['lon']),
            )
    except Exception:
        pass


def _flag_if_duplicate(listing, poster):
    """
    Flag listing for admin review if it matches another user's recent listing by:
      1. Same contact phone or WhatsApp number
      2. Title word overlap >= 80%
      3. Description word overlap >= 75% (first 120 words compared)
    """
    thirty_days_ago = timezone.now() - timedelta(days=30)
    recent_others = (
        Listing.objects
        .filter(created_at__gte=thirty_days_ago, status__in=['active', 'filled'])
        .exclude(user=poster)
    )

    # ── 1. Phone match + title similarity ───────────────────────
    # Phone alone is not enough — a legitimate employer can post "Cook" and
    # "Aged Care Worker" with the same number. Require >= 40% title overlap too.
    numbers = [
        n for n in [
            _normalize_phone(listing.contact_phone),
            _normalize_phone(listing.contact_whatsapp),
        ]
        if len(n) >= 8
    ]
    if numbers:
        new_title_words_for_phone = _normalize_text(listing.title)
        for other in recent_others.only('id', 'contact_phone', 'contact_whatsapp', 'title'):
            other_nums = {_normalize_phone(other.contact_phone), _normalize_phone(other.contact_whatsapp)}
            if any(n in other_nums for n in numbers):
                other_title_words = _normalize_text(other.title)
                if _word_overlap(new_title_words_for_phone, other_title_words) >= 0.4:
                    listing.is_under_review = True
                    listing.save(update_fields=['is_under_review'])
                    try:
                        matched = Listing.objects.select_related('user').get(pk=other.id)
                    except Listing.DoesNotExist:
                        matched = None
                    send_spam_detected_email(listing, 'phone_match', matched_listing=matched)
                    return

    # ── 2. Title + description similarity ──────────────────────
    new_title_words = _normalize_text(listing.title)
    new_desc_words  = _normalize_text(listing.description)[:120]

    if len(new_title_words) < 2 and len(new_desc_words) < 10:
        return

    for other in recent_others.only('id', 'title', 'description', 'user'):
        other_title_words = _normalize_text(other.title)
        other_desc_words  = _normalize_text(other.description)[:120]

        title_overlap = _word_overlap(new_title_words, other_title_words)
        desc_overlap  = _word_overlap(new_desc_words, other_desc_words)

        reason = None
        if title_overlap >= 0.8:
            reason = 'title_match'
        elif len(new_desc_words) >= 10 and len(other_desc_words) >= 10 and desc_overlap >= 0.75:
            reason = 'description_match'

        if reason:
            listing.is_under_review = True
            listing.save(update_fields=['is_under_review'])
            send_spam_detected_email(listing, reason, matched_listing=other)
            return


def _image_md5(file_obj):
    """Return MD5 hex digest of an uploaded file without consuming the stream."""
    file_obj.seek(0)
    digest = hashlib.md5(file_obj.read()).hexdigest()
    file_obj.seek(0)
    return digest


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission for NepSaathi listings.
    - Anyone can read (GET)
    - Only the owner can edit or delete (PUT, PATCH, DELETE)
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user


class ListingListView(generics.ListAPIView):
    """
    GET /api/listings/
    Returns all active listings.
    Supports filtering by listing_type, state, status.
    Supports searching by title, description, location.

    Examples:
        /api/listings/?listing_type=job
        /api/listings/?state=NSW
        /api/listings/?search=kitchen
        /api/listings/?listing_type=room&state=VIC
    """
    serializer_class = ListingSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_fields = ('listing_type', 'state', 'status', 'is_featured', 'user')
    ordering_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

    def get_queryset(self):
        from django.contrib.postgres.search import SearchQuery
        qs = Listing.objects.filter(
            status='active',
            is_under_review=False,
        ).select_related('user').prefetch_related(
            'images', 'job_detail', 'room_detail', 'reports'
        ).annotate(
            view_count_annotated=Count('views')
        )
        if self.request.query_params.get('new') == 'true':
            qs = qs.filter(created_at__gte=timezone.now() - timedelta(hours=24))
        q = self.request.query_params.get('search', '').strip()
        if q:
            qs = qs.filter(search_vector=SearchQuery(q, search_type='websearch', config='english'))
        return qs


class ListingCreateView(generics.CreateAPIView):
    """
    POST /api/listings/create/
    Creates a new listing.

    Security:
    - Must be authenticated
    - Max 20 active listings per user
    - 5 minute cooldown between posts
    - Duplicate title detection within 24 hours
    """
    serializer_class = ListingCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ListingCreateThrottle,)

    def perform_create(self, serializer):
        user = self.request.user

        # Check if user is banned FIRST
        if user.is_banned:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    'Your account has been suspended due to multiple violations. Contact support@nepsaathi.com'
                )

        # Check max active listings per user
        active_count = Listing.objects.filter(
            user=user, status='active'
        ).count()
        if active_count >= 20:
            raise ValidationError(
                'You have reached the maximum of 20 active listings.'
            )
        
        # Check 5 minute cooldown — exclude soft-deleted listings so a failed
        # attempt that gets rolled back doesn't lock the user out.
        five_mins_ago = timezone.now() - timedelta(minutes=5)
        last_recent = Listing.objects.filter(
            user=user, created_at__gte=five_mins_ago
        ).exclude(status='deleted').order_by('-created_at').first()
        if last_recent:
            elapsed = (timezone.now() - last_recent.created_at).total_seconds()
            seconds_left = max(1, int(300 - elapsed))
            raise ValidationError({'cooldown': seconds_left})
        # Check duplicate title in last 24 hours — exclude soft-deleted listings
        # so a rolled-back failed attempt doesn't block a retry with the same title.
        yesterday = timezone.now() - timedelta(hours=24)
        title = self.request.data.get('title', '').strip().lower()
        duplicate = Listing.objects.filter(
            user=user,
            title__iexact=title,
            created_at__gte=yesterday,
        ).exclude(status='deleted').exists()
        if duplicate:
            raise ValidationError(
                'You already posted a listing with this title in the last 24 hours.'
            )

        # Set expiry to 30 days from now
        expires_at = timezone.now() + timedelta(days=30)
        listing = serializer.save(user=user, expires_at=expires_at)

        # Cross-user duplicate check — run in background so it doesn't block the response
        import threading
        threading.Thread(target=_flag_if_duplicate, args=(listing, user), daemon=True).start()

        # Geocode suburb+state in background for map view
        threading.Thread(target=_geocode_listing, args=(listing,), daemon=True).start()

        # Fire saved search alerts in background
        try:
            from core.emails import send_saved_search_alert_email
            _trigger_saved_search_alerts(listing, send_saved_search_alert_email)
        except Exception as e:
            logger.error('Saved search alert trigger failed: %s', e)

        # Award points for posting a listing (silently — never block the response)
        try:
            user.award_points(5, 'post_ad', f'Posted listing: {listing.title[:60]}')
        except Exception:
            pass

        # Notify n8n to post to Facebook (fire-and-forget)
        threading.Thread(target=_notify_n8n, args=(listing,), daemon=False).start()

        # Ping IndexNow so Bing/Yandex index the new listing quickly
        from core.indexnow import ping_indexnow
        type_path = _LISTING_TYPE_PATH.get(listing.listing_type, listing.listing_type + 's')
        ping_indexnow(f"/{type_path}/{listing.slug}")


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/listings/<id>/  — view single listing
    PATCH  /api/listings/<id>/  — update listing (owner only)
    DELETE /api/listings/<id>/  — delete listing (owner only)
    """
    serializer_class = ListingSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly)
    lookup_field = 'slug'

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Listing.objects.select_related('user').prefetch_related('images').filter(
                Q(status='active', is_under_review=False) | Q(user=user)
            ).exclude(status='deleted')
        return Listing.objects.select_related('user').prefetch_related('images').filter(
            status='active', is_under_review=False
        )

    def perform_update(self, serializer):
        if self.request.user.is_banned:
            raise ValidationError(
                'Your account has been suspended. Contact support@nepsaathi.com'
            )
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        if request.user.is_banned:
            return Response({'detail': 'Your account has been suspended.'}, status=403)
        listing = self.get_object()
        # Soft delete first so listing is gone even if image cleanup fails
        listing.status = 'deleted'
        listing.save()
        for image in listing.images.all():
            image.delete()

        return Response(
            {'detail': 'Listing deleted successfully.'},
            status=status.HTTP_200_OK
        )


class MyListingsView(generics.ListAPIView):
    """
    GET /api/listings/my-listings/
    Returns all listings posted by the logged in user.
    """
    serializer_class = ListingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        now = timezone.now()
        return Listing.objects.filter(
            user=self.request.user,
        ).exclude(
            status='deleted'
        ).select_related('user').prefetch_related(
            'images', 'job_detail', 'room_detail'
        ).annotate(
            view_count_annotated=Count('views'),
            sort_priority=Case(
                When(is_under_review=True, then=Value(0)),
                When(status='active', expires_at__lte=now + timedelta(days=5), then=Value(1)),
                When(status='active', then=Value(2)),
                When(status='filled', then=Value(3)),
                When(status='expired', then=Value(4)),
                default=Value(5),
                output_field=IntegerField(),
            )
        ).order_by('sort_priority', '-created_at')


class ListingImageUploadView(APIView):
    """
    POST /api/listings/<id>/images/
    Upload images to a listing — stored on Cloudinary.
    Only the listing owner can upload images.
    Max 5 images per listing.

    Security:
    - Must be authenticated
    - Must own the listing
    - Max 5 images per listing
    - Only image files accepted
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk, user=request.user)
        except Listing.DoesNotExist:
            return Response(
                {'detail': 'Listing not found or you do not own it.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Max 5 images per listing
        existing_count = listing.images.count()
        if existing_count >= 5:
            return Response(
                {'detail': 'Maximum 5 images per listing.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {'detail': 'No images provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Limit to remaining slots
        remaining = 5 - existing_count
        images = images[:remaining]

        has_existing_images = listing.images.exists()
        uploaded = []
        for i, image in enumerate(images):
            # Validate file size — max 5MB
            if image.size > 5 * 1024 * 1024:
                continue

            # Validate actual file bytes (not client-declared MIME) using Pillow
            try:
                from PIL import Image as PilImage
                image.seek(0)
                PilImage.open(image).verify()
                image.seek(0)
            except Exception:
                continue

            img_hash = _image_md5(image)
            # Cross-user image duplicate check — flags listing for admin review
            matched_img = ListingImage.objects.filter(
                image_hash=img_hash
            ).exclude(listing__user=request.user).select_related('listing__user').first() if img_hash else None
            if matched_img:
                listing.is_under_review = True
                listing.save(update_fields=['is_under_review'])
                send_spam_detected_email(listing, 'image_hash', matched_listing=matched_img.listing)

            listing_image = ListingImage.objects.create(
                listing=listing,
                image=image,
                is_primary=(i == 0 and not has_existing_images),
                image_hash=img_hash,
            )
            uploaded.append(ListingImageSerializer(listing_image).data)

        if not uploaded:
            return Response({'error': 'No valid images uploaded. Check file size and format.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(uploaded, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        """
        DELETE /api/listings/<id>/images/<image_id>/
        Delete a specific image from Cloudinary and database.
        """
        image_id = request.data.get('image_id')
        try:
            image = ListingImage.objects.get(
                pk=image_id,
                listing__pk=pk,
                listing__user=request.user
            )
            image.delete()  # This calls our custom delete which removes from Cloudinary
            return Response(
                {'detail': 'Image deleted successfully.'},
                status=status.HTTP_200_OK
            )
        except ListingImage.DoesNotExist:
            return Response(
                {'detail': 'Image not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

class StatsView(APIView):
    """
    GET /api/listings/stats/
    Returns live counts for the homepage stats section.
    Cached for 10 minutes to avoid DB hits on every page load.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        from django.core.cache import cache
        from users.models import User

        cached = cache.get('nepsaathi_stats')
        if cached:
            return Response(cached)

        stats = {
            'total_jobs': Listing.objects.filter(
                listing_type='job', status='active', is_under_review=False
            ).count(),
            'total_rooms': Listing.objects.filter(
                listing_type='room', status='active', is_under_review=False
            ).count(),
            'total_members': User.objects.filter(
                is_active=True
            ).count(),
            'total_events': Listing.objects.filter(
                listing_type='event', status='active', is_under_review=False
            ).count(),
            'total_businesses': Business.objects.filter(
                is_active=True
            ).count(),
        }

        cache.set('nepsaathi_stats', stats, 60 * 10)
        return Response(stats)

class SaveListingView(APIView):
    """
    POST /api/listings/<id>/save/   — save a listing
    DELETE /api/listings/<id>/save/ — unsave a listing
    GET /api/listings/<id>/save/    — check if saved
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, pk):
        is_saved = SavedListing.objects.filter(
            user=request.user,
            listing__pk=pk
        ).exists()
        return Response({'is_saved': is_saved})

    def post(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk, status='active')
        except Listing.DoesNotExist:
            return Response(
                {'detail': 'Listing not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        saved, created = SavedListing.objects.get_or_create(
            user=request.user,
            listing=listing
        )
        if created:
            return Response({'is_saved': True, 'detail': 'Listing saved!'})
        return Response({'is_saved': True, 'detail': 'Already saved.'})

    def delete(self, request, pk):
        deleted = SavedListing.objects.filter(
            user=request.user,
            listing__pk=pk
        ).delete()
        if deleted[0]:
            return Response({'is_saved': False, 'detail': 'Listing unsaved!'})
        return Response(
            {'detail': 'Not saved.'},
            status=status.HTTP_404_NOT_FOUND
        )


class MySavedListingsView(generics.ListAPIView):
    """
    GET /api/listings/saved/
    Returns all listings saved by the logged in user.
    """
    serializer_class = SavedListingSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return SavedListing.objects.filter(
            user=self.request.user
        ).select_related('listing', 'listing__user')

class ReportListingView(APIView):
    """
    POST /api/listings/<id>/report/
    Report a listing for spam, fake content etc.

    Security:
    - Must be authenticated
    - One report per user per listing
    - Cannot report your own listing
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk, status='active')
        except Listing.DoesNotExist:
            return Response(
                {'detail': 'Listing not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if listing.user == request.user:
            return Response(
                {'detail': 'You cannot report your own listing.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if ListingReport.objects.filter(
            user=request.user,
            listing=listing
        ).exists():
            return Response(
                {'detail': 'You have already reported this listing.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Limit 5 reports per day per user (rolling 24-hour window in UTC)
        one_day_ago = timezone.now() - timedelta(hours=24)
        daily_reports = ListingReport.objects.filter(
            user=request.user,
            created_at__gte=one_day_ago
        ).count()
        if daily_reports >= 5:
            return Response(
                {'detail': 'You have reached the maximum of 5 reports per day.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ListingReportSerializer(data={
            'listing': listing.id,
            'reason': request.data.get('reason', 'spam'),
            'details': request.data.get('details', ''),
        })

        if serializer.is_valid():
            try:
                from django.db import IntegrityError
                report = serializer.save(user=request.user, listing=listing)
            except IntegrityError:
                return Response(
                    {'detail': 'You have already reported this listing.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Send emails to admin and listing owner
            # NOTE: is_under_review is NOT set here — admins review the report
            # and hide the listing manually if warranted. Spam auto-detection
            # is the only automated path that sets is_under_review=True.
            try:
                from core.emails import send_report_emails
                send_report_emails(report)
            except Exception as e:
                logger.error('Report email failed: %s', e)
            return Response(
                {'detail': 'Report submitted. Thank you for keeping NepSaathi safe!'},
                status=status.HTTP_201_CREATED
            ) # Properly closed and indented
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST) # Always handle the 'else' case for is_valid()

class MarkListingStatusView(APIView):
    """
    PATCH /api/listings/<id>/status/
    Owner can mark listing as filled/taken/active
    """
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, pk):
        if request.user.is_banned:
            return Response({'detail': 'Your account has been suspended.'}, status=403)
        try:
            listing = Listing.objects.get(pk=pk, user=request.user)
        except Listing.DoesNotExist:
            return Response(
                {'detail': 'Listing not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        new_status = request.data.get('status')
        if new_status not in ['active', 'filled']:
            return Response(
                {'detail': 'Invalid status. Use active or filled.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if new_status == 'active' and listing.renewal_blocked:
            return Response(
                {'detail': 'This listing has been restricted by an administrator and cannot be reactivated.'},
                status=status.HTTP_403_FORBIDDEN
            )
        listing.status = new_status
        listing.save()
        return Response({'detail': f'Listing marked as {new_status}.'})
    
class TrackListingViewView(APIView):
    """
    POST /api/listings/<id>/view/
    Track a unique view for a listing.
    """
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (ListingViewThrottle,)

    def post(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk, status='active')
        except Listing.DoesNotExist:
            return Response({'detail': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get IP address
        ip = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if ip:
            ip = ip.split(',')[-1].strip()   # rightmost = Railway-appended real IP; cannot be spoofed
        else:
            ip = request.META.get('REMOTE_ADDR', '')
        if not ip:
            ip = '127.0.0.1'

        user = request.user if request.user.is_authenticated else None

        if user and listing.user_id == user.id:
            view_count = ListingView.objects.filter(listing=listing).count()
            return Response({'views': view_count})

        if user:
            # Logged in — count once ever per user per listing
            already_viewed = ListingView.objects.filter(
                listing=listing, user=user
            ).exists()
        else:
            # Logged out — count once per IP per 24 hours
            from django.utils import timezone
            from datetime import timedelta
            yesterday = timezone.now() - timedelta(hours=24)
            already_viewed = ListingView.objects.filter(
                listing=listing,
                ip_address=ip,
                viewed_at__gte=yesterday
            ).exists()

        if not already_viewed:
            ListingView.objects.create(
                listing=listing,
                user=user,
                ip_address=ip,
            )

        view_count = ListingView.objects.filter(listing=listing).count()
        return Response({'views': view_count})

class SimilarListingsView(APIView):
    """
    GET /api/listings/<id>/similar/
    Returns up to 3 similar listings based on type and state.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request, pk):
        try:
            listing = Listing.objects.get(pk=pk)
        except Listing.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        # Get similar listings — same type, same state, exclude current
        similar = Listing.objects.filter(
            listing_type=listing.listing_type,
            status='active',
            is_under_review=False,
            state=listing.state,
        ).exclude(pk=pk).select_related('user').prefetch_related('images').order_by('-is_featured', '-created_at')[:3]

        # If not enough in same state, get from anywhere
        similar_list = list(similar)
        if len(similar_list) < 3:
            extra = Listing.objects.filter(
                listing_type=listing.listing_type,
                status='active',
                is_under_review=False,
            ).exclude(
                pk=pk
            ).exclude(
                pk__in=[s.pk for s in similar_list]
            ).select_related('user').prefetch_related('images').order_by('-is_featured', '-created_at')[:3 - len(similar_list)]
            similar_list = similar_list + list(extra)
        similar = similar_list

        from listings.serializers import ListingSerializer
        serializer = ListingSerializer(
            similar, many=True, context={'request': request}
        )
        return Response(serializer.data)

class SearchSuggestionsView(APIView):
    """
    GET /api/listings/search-suggestions/?q=kitchen
    Returns search suggestions based on query.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 2:
            return Response([])

        from django.db.models import Q
        suggestions = []

        # Search listing titles
        listings = Listing.objects.filter(
            Q(title__icontains=query) |
            Q(location__icontains=query),
            status='active',
            is_under_review=False,
        ).values('title', 'listing_type', 'location', 'state', 'id')[:8]

        for listing in listings:
            suggestions.append({
                'type': 'listing',
                'label': listing['title'],
                'sublabel': f"{listing['location']}, {listing['state']}",
                'listing_type': listing['listing_type'],
                'id': listing['id'],
            })

        return Response(suggestions)

class GlobalSearchView(APIView):
    """
    GET /api/listings/search/?q=kitchen
    Returns results from all listing types.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        state = request.query_params.get('state', '').strip()

        if len(query) < 2 and not state:
            return Response({
                'jobs': [], 'rooms': [], 'events': [], 'notices': [], 'businesses': []
            })

        from django.db.models import Q
        from django.contrib.postgres.search import SearchQuery
        from jobs.models import Job
        from jobs.serializers import JobSerializer
        from rooms.models import Room
        from rooms.serializers import RoomSerializer
        from events.models import Event
        from events.serializers import EventSerializer
        from announcements.models import Announcement
        from announcements.serializers import AnnouncementSerializer
        from businesses.serializers import BusinessSerializer

        if query:
            search_query = SearchQuery(query, search_type='websearch', config='english')
            base_filter = Q(listing__search_vector=search_query)
        else:
            base_filter = Q()  # state-only search — no text filter
        state_filter = Q(listing__state=state) if state else Q()
        biz_state_filter = Q(state=state) if state else Q()

        jobs = Job.objects.filter(
            base_filter & state_filter,
            listing__status='active',
            listing__is_under_review=False,
        ).select_related('listing', 'listing__user')[:5]

        rooms = Room.objects.filter(
            base_filter & state_filter,
            listing__status='active',
            listing__is_under_review=False,
        ).select_related('listing', 'listing__user')[:5]

        events = Event.objects.filter(
            base_filter & state_filter,
            listing__status='active',
            listing__is_under_review=False,
        ).select_related('listing', 'listing__user')[:5]

        announcements = Announcement.objects.filter(
            base_filter & state_filter,
            listing__status='active',
            listing__is_under_review=False,
        ).select_related('listing', 'listing__user')[:5]

        businesses = Business.objects.filter(
            (Q(business_name__icontains=query) | Q(description__icontains=query) | Q(suburb__icontains=query))
            & biz_state_filter,
            is_active=True,
        ).select_related('owner')[:5]

        biz_data = [
            {
                'id': b.id,
                'listing_slug': b.slug,
                'listing_title': b.business_name,
                'listing_location': b.suburb,
                'listing_state': b.state,
                'posted_by': b.owner.full_name if b.owner else '',
                'is_featured': b.is_featured,
            }
            for b in businesses
        ]

        return Response({
            'jobs': JobSerializer(jobs, many=True, context={'request': request}).data,
            'rooms': RoomSerializer(rooms, many=True, context={'request': request}).data,
            'events': EventSerializer(events, many=True, context={'request': request}).data,
            'notices': AnnouncementSerializer(announcements, many=True, context={'request': request}).data,
            'businesses': biz_data,
        })

class RenewListingView(APIView):
    """
    POST /api/listings/<id>/renew/
    Extends listing expiry by 30 days from today.
    Owner only. Can only renew if listing expires within 7 days (or is already expired).
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, pk):
        if request.user.is_banned:
            return Response({'detail': 'Your account has been suspended.'}, status=403)
        try:
            listing = Listing.objects.get(pk=pk, user=request.user)
        except Listing.DoesNotExist:
            return Response(
                {'detail': 'Listing not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if listing.status in ('deleted', 'filled'):
            return Response(
                {'detail': 'Cannot renew a deleted or filled listing.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if listing.is_under_review:
            return Response(
                {'detail': 'Your listing is currently under review and cannot be renewed. Please contact support@nepsaathi.com for assistance.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if listing.renewal_blocked:
            return Response(
                {'detail': 'Renewal has been restricted on this listing by our team. Please contact support@nepsaathi.com for assistance.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only allow renewal when expiry is within 7 days (or already expired)
        if listing.expires_at and listing.expires_at > timezone.now() + timedelta(days=7):
            days_left = (listing.expires_at - timezone.now()).days
            return Response(
                {'detail': f'Your listing still has {days_left} days left. You can renew it when it is within 7 days of expiry.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        listing.expires_at = timezone.now() + timedelta(days=30)
        listing.status = 'active'
        listing.expiry_warning_sent = False
        listing.save()

        try:
            from core.emails import send_listing_renewed_email
            send_listing_renewed_email(listing)
        except Exception as e:
            logger.error('Listing renewed email failed: %s', e)

        return Response({
            'detail': 'Listing renewed successfully!',
            'expires_at': listing.expires_at,
        })


class ListingBenchmarkView(APIView):
    """
    GET /api/listings/benchmark/
    Returns avg/min/max salary for jobs or rent for rooms to show market context inside a listing.
    ?type=job&job_type=casual&state=NSW
    ?type=room&location=Parramatta&state=NSW
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        from django.db.models import Avg, Min, Max, Count as DCount
        listing_type = request.query_params.get('type', '')
        state = request.query_params.get('state', '')

        if listing_type == 'job':
            from jobs.models import Job
            job_type = request.query_params.get('job_type', '')
            qs = Job.objects.filter(
                listing__status='active',
                listing__state=state,
            ).exclude(salary__isnull=True).exclude(salary_type='negotiable')
            if job_type:
                qs = qs.filter(job_type=job_type)
            agg = qs.aggregate(avg=Avg('salary'), mn=Min('salary'), mx=Max('salary'), cnt=DCount('id'))
            if not agg['cnt']:
                return Response({'available': False})
            salary_types = list(qs.values_list('salary_type', flat=True))
            most_common_type = max(set(salary_types), key=salary_types.count) if salary_types else 'hourly'
            suffix = {'hourly': '/hr', 'weekly': '/wk', 'monthly': '/mo', 'yearly': '/yr'}.get(most_common_type, '/hr')
            return Response({
                'available': True,
                'count': agg['cnt'],
                'avg': round(float(agg['avg'] or 0), 2),
                'min': round(float(agg['mn'] or 0), 2),
                'max': round(float(agg['mx'] or 0), 2),
                'suffix': suffix,
                'label': f"{job_type.replace('_', ' ').title()} jobs in {state}" if job_type else f"Jobs in {state}",
            })

        if listing_type == 'room':
            from rooms.models import Room
            location = request.query_params.get('location', '')
            qs = Room.objects.filter(listing__status='active', listing__state=state)
            if location:
                qs = qs.filter(listing__location__icontains=location)
            agg = qs.aggregate(avg=Avg('price'), mn=Min('price'), mx=Max('price'), cnt=DCount('id'))
            if not agg['cnt']:
                # Fall back to state-wide average if suburb has no data
                agg = Room.objects.filter(listing__status='active', listing__state=state).aggregate(
                    avg=Avg('price'), mn=Min('price'), mx=Max('price'), cnt=DCount('id')
                )
                if not agg['cnt']:
                    return Response({'available': False})
                location = ''
            return Response({
                'available': True,
                'count': agg['cnt'],
                'avg': round(float(agg['avg'] or 0), 2),
                'min': round(float(agg['mn'] or 0), 2),
                'max': round(float(agg['mx'] or 0), 2),
                'label': f"Rooms in {location}" if location else f"Rooms in {state}",
            })

        return Response({'available': False})


class AIImproveDescriptionView(APIView):
    """POST /api/listings/ai-improve/ — rewrites a rough listing description using Llama 3 via Groq."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'ai_improve'

    def post(self, request):
        import groq as groq_sdk
        from decouple import config as env_config

        title = (request.data.get('title') or '').strip()
        description = (request.data.get('description') or '').strip()
        listing_type = (request.data.get('listing_type') or 'listing').strip()
        location = (request.data.get('location') or '').strip()
        state = (request.data.get('state') or '').strip()

        if not description or len(description) < 10:
            return Response({'error': 'Please write at least a few words first.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(description) > 5000:
            return Response({'error': 'Description is too long (max 5000 characters).'}, status=status.HTTP_400_BAD_REQUEST)

        # Truncate context fields and strip XML tags to prevent prompt injection
        import re as _re_ai
        def _sanitize(text, max_len):
            return _re_ai.sub(r'<[^>]{0,200}>', '', text)[:max_len]

        title = _sanitize(title, 200)
        description = _sanitize(description, 1500)
        listing_type = _sanitize(listing_type, 50)
        location = _sanitize(location, 100)
        state = _sanitize(state, 50)

        api_key = env_config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'AI service not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        context_parts = []
        if listing_type:
            context_parts.append(f"Type: {listing_type}")
        if title:
            context_parts.append(f"Title: {title}")
        if location or state:
            context_parts.append(f"Location: {', '.join(filter(None, [location, state, 'Australia']))}")
        context_block = '\n'.join(context_parts)

        prompt = f"""You are a professional copywriter improving listings on NepSaathi, a community platform for Nepalese Australians.

<listing_context>
{context_block}
</listing_context>

<user_draft>
{description}
</user_draft>

Rewrite the description to be polished, professional, and compelling for an Australian audience. Rules:
- Start with a strong, engaging opening sentence that captures attention
- Use clear, professional language with correct grammar and spelling
- Organise content into short, readable paragraphs (no bullet points)
- Highlight key details and benefits naturally within the prose
- Keep every factual detail the user provided — do not invent anything
- Under 200 words
- No markdown formatting (no **, no ##, no lists)

Return only the improved description text — no preamble, no explanation."""

        try:
            client = groq_sdk.Groq(api_key=api_key)
            chat = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                max_tokens=380,
                messages=[{"role": "user", "content": prompt}],
            )
            import re as _re
            improved = chat.choices[0].message.content.strip()
            improved = _re.sub(r'</?user_draft>', '', improved).strip()
            return Response({'improved': improved})
        except groq_sdk.APIError as e:
            logger.error("Groq API error in ai-improve: %s", e)
            return Response({'error': 'AI service temporarily unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class AITagSuggestView(APIView):
    """POST /api/listings/ai-suggest-tags/ — returns 5 relevant hashtags for a listing."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'ai_suggest_tags'

    def post(self, request):
        import groq as groq_sdk
        import json as _json
        from decouple import config as env_config

        title = (request.data.get('title') or '').strip()
        description = (request.data.get('description') or '').strip()
        listing_type = (request.data.get('listing_type') or '').strip()

        if not title and not description:
            return Response({'error': 'Provide a title or description first.'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = env_config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'AI service not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        # Sanitize inputs to prevent prompt injection, then truncate
        import re as _re_tags
        def _sanitize_tag(t, n):
            return _re_tags.sub(r'<[^>]{0,200}>', '', t)[:n]
        title = _sanitize_tag(title, 200)
        description = _sanitize_tag(description, 5000)
        listing_type = _sanitize_tag(listing_type, 50)

        # Keep input short so the model has room to output
        desc_snippet = description[:150] if description else ""
        listing_text = f"{listing_type or 'listing'}: {title}" + (f" — {desc_snippet}" if desc_snippet else "")

        try:
            client = groq_sdk.Groq(api_key=api_key)
            chat = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                max_tokens=300,
                messages=[
                    {"role": "system", "content": "You output only JSON arrays of strings. No explanation, no markdown, no extra text."},
                    {"role": "user", "content": f'Give 10 short lowercase tags (1-3 words each, no # symbol) for: {listing_text}. Output only a JSON array. Example: ["kitchen hand", "sydney", "full time", "hospitality", "urgent", "casual", "food industry", "immediate start", "nsw", "nepalese"]'},
                ],
            )
            choice = chat.choices[0]
            raw = choice.message.content
            logger.info("ai-suggest-tags raw=%r finish_reason=%s", raw, choice.finish_reason)
            if not raw:
                logger.error("ai-suggest-tags: empty/None content, finish_reason=%s", choice.finish_reason)
                return Response({'error': 'AI returned no content. Try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            raw = raw.strip()
            import re as _re
            match = _re.search(r'\[.*\]', raw, _re.DOTALL)
            if not match:
                logger.error("ai-suggest-tags: no JSON array in: %r", raw)
                return Response({'error': 'AI returned unexpected format.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            try:
                tags = _json.loads(match.group())
            except _json.JSONDecodeError:
                # Single-quoted fallback
                fixed = match.group().replace("'", '"')
                tags = _json.loads(fixed)
            tags = [str(t).lower().strip().lstrip('#') for t in tags if t][:10]
            return Response({'tags': tags})
        except groq_sdk.APIError as e:
            logger.error("Groq API error in ai-suggest-tags: %s", e)
            return Response({'error': 'AI service temporarily unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error("ai-suggest-tags error: %s", e)
            return Response({'error': 'Could not generate tags. Try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MyListingAnalyticsView(APIView):
    """GET /api/listings/my-analytics/ — per-listing stats for the logged-in user."""
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        from django.db.models import Count as DCount
        from messaging.models import Conversation

        listings = Listing.objects.filter(user=request.user).exclude(status='deleted').order_by('-created_at')
        listing_ids = list(listings.values_list('id', flat=True))

        view_counts = {r['listing_id']: r['c'] for r in
                       ListingView.objects.filter(listing_id__in=listing_ids)
                                          .values('listing_id').annotate(c=DCount('id'))}

        save_counts = {r['listing_id']: r['c'] for r in
                       SavedListing.objects.filter(listing_id__in=listing_ids)
                                           .values('listing_id').annotate(c=DCount('id'))}

        msg_counts = {r['listing_id']: r['c'] for r in
                      Conversation.objects.filter(listing_id__in=listing_ids)
                                          .values('listing_id').annotate(c=DCount('id'))}

        results = []
        for l in listings:
            results.append({
                'id': l.id,
                'slug': l.slug,
                'title': l.title,
                'listing_type': l.listing_type,
                'status': l.status,
                'location': l.location,
                'created_at': l.created_at,
                'views': view_counts.get(l.id, 0),
                'saves': save_counts.get(l.id, 0),
                'messages': msg_counts.get(l.id, 0),
            })

        return Response(results)


def _trigger_saved_search_alerts(listing, send_fn):
    """Check saved searches matching a newly created listing and fire email alerts."""
    import threading

    def _run():
        from django.utils import timezone as tz
        searches = SavedSearch.objects.filter(
            listing_type=listing.listing_type,
            is_active=True,
        ).exclude(user=listing.user).select_related('user')

        one_hour_ago = tz.now() - timedelta(hours=1)
        for saved in searches:
            try:
                # Skip if already notified within the last hour (prevents duplicate alerts)
                if saved.last_notified and saved.last_notified > one_hour_ago:
                    continue

                filters = saved.filters or {}
                keyword = filters.get('search', '').lower()
                if keyword:
                    words = [w for w in keyword.split() if len(w) > 1]
                    text = f"{listing.title} {listing.description or ''}".lower()
                    if words and not all(w in text for w in words):
                        continue
                if filters.get('state') and filters['state'] != listing.state:
                    continue

                send_fn(saved.user, listing, saved.id)

                saved.last_notified = tz.now()
                saved.save(update_fields=['last_notified'])
            except Exception as e:
                logger.error('[SEARCH ALERT] Search #%s failed: %s', saved.id, e)

    threading.Thread(target=_run, daemon=True).start()


class SavedSearchListView(APIView):
    """
    GET  /api/listings/saved-searches/        — list user's saved searches
    POST /api/listings/saved-searches/        — create a saved search
    """
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        searches = SavedSearch.objects.filter(user=request.user)
        return Response(SavedSearchSerializer(searches, many=True).data)

    def post(self, request):
        if SavedSearch.objects.filter(user=request.user).count() >= 10:
            raise ValidationError('You can save up to 10 searches.')
        serializer = SavedSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SavedSearchDetailView(APIView):
    """
    PATCH  /api/listings/saved-searches/<id>/  — toggle is_active or rename
    DELETE /api/listings/saved-searches/<id>/  — delete a saved search
    """
    permission_classes = (permissions.IsAuthenticated,)

    def _get(self, pk, user):
        try:
            return SavedSearch.objects.get(pk=pk, user=user)
        except SavedSearch.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Saved search not found.')

    def patch(self, request, pk):
        saved = self._get(pk, request.user)
        serializer = SavedSearchSerializer(saved, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        self._get(pk, request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SitemapDataView(APIView):
    """
    GET /api/listings/sitemap/
    Returns all public listing slugs + business slugs for sitemap generation.
    """
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        now = timezone.now()
        listings = (
            Listing.objects
            .filter(status='active', is_under_review=False)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .values('slug', 'listing_type', 'updated_at')
            .order_by('-updated_at')
        )
        businesses = (
            Business.objects
            .filter(is_active=True)
            .values('slug', 'updated_at')
            .order_by('-updated_at')
        )

        type_to_path = {
            'job': 'jobs',
            'room': 'rooms',
            'event': 'events',
            'notice': 'notices',
        }

        return Response({
            'listings': [
                {
                    'path': f"/{type_to_path.get(l['listing_type'], l['listing_type'])}/{l['slug']}",
                    'lastmod': l['updated_at'].strftime('%Y-%m-%d'),
                }
                for l in listings
                if l['listing_type'] in type_to_path
            ],
            'businesses': [
                {
                    'path': f"/businesses/{b['slug']}",
                    'lastmod': b['updated_at'].strftime('%Y-%m-%d'),
                }
                for b in businesses
            ],
        })