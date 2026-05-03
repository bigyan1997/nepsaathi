

# Create your views here.
from rest_framework import generics, permissions, filters
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from listings.models import Listing
from .models import Announcement
from .serializers import AnnouncementSerializer


class AnnouncementListView(generics.ListAPIView):
    """
    GET /api/announcements/
    Returns all active announcements.
    Anyone can browse — no login needed.

    Security:
    - Read only — no authentication required
    - Filtered to active listings only
    - Rate limited via DEFAULT_THROTTLE_CLASSES in settings

    Filters:
        /api/announcements/?category=sale
        /api/announcements/?is_free=true
        /api/announcements/?is_urgent=true
        /api/announcements/?search=laptop
    """
    serializer_class = AnnouncementSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    )
    filterset_fields = ('category', 'is_free', 'is_urgent', 'condition')
    search_fields = (
        'listing__title',
        'listing__description',
        'listing__location',
        'listing__state',
    )
    ordering_fields = ('listing__created_at', 'listing__is_featured')
    ordering = ('-listing__is_featured', '-listing__created_at',)

    def get_queryset(self):
        from django.db.models import Count
        return Announcement.objects.filter(
            listing__status='active'
        ).select_related('listing', 'listing__user').annotate(
            view_count_annotated=Count('listing__views')
        )


class AnnouncementCreateView(generics.CreateAPIView):
    """
    POST /api/announcements/create/
    Creates announcement details attached to an existing listing.

    Security:
    - Must be authenticated (IsAuthenticated)
    - listing must belong to the logged in user
    - listing must be of type announcement
    - Prevents users attaching details to someone else's listing
    """
    serializer_class = AnnouncementSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_banned:
            raise ValidationError('Your account has been suspended.')
        listing_id = self.request.data.get('listing')

        # Validate listing exists and belongs to user
        try:
            listing = Listing.objects.get(
                pk=listing_id,
                user=user,
                listing_type='notice'
            )
        except Listing.DoesNotExist:
            raise PermissionDenied(
                'Listing not found, not yours, or not a notice.'
            )

        # Prevent duplicate announcement details
        if hasattr(listing, 'announcement_detail'):
            raise PermissionDenied(
                'This listing already has notice details.'
            )

        serializer.save(listing=listing)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/announcements/<id>/  — view single announcement
    PATCH  /api/announcements/<id>/  — update (owner only)
    DELETE /api/announcements/<id>/  — delete (owner only)

    Security:
    - Read: anyone
    - Write: owner only
    """
    serializer_class = AnnouncementSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        return Announcement.objects.select_related(
            'listing', 'listing__user'
        )

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.listing.user != request.user:
                raise PermissionDenied(
                    'You do not own this listing.'
                )


class AnnouncementDetailByListingView(generics.RetrieveAPIView):
    """
    GET /api/announcements/listing/<listing_id>/
    Fetches announcement detail by parent listing ID.
    Used after creating to redirect to detail page.

    Security:
    - Read only — no authentication required
    """
    serializer_class = AnnouncementSerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self):
        listing_slug = self.kwargs['listing_slug']
        try:
            return Announcement.objects.select_related(
                'listing', 'listing__user'
            ).get(listing__slug=listing_slug)
        except Announcement.DoesNotExist:
            raise NotFound('Announcement not found.')