from rest_framework import generics, permissions, filters
from rest_framework.exceptions import PermissionDenied, NotFound
from django_filters.rest_framework import DjangoFilterBackend
from listings.models import Listing
from .models import Event
from .serializers import EventSerializer


class EventListView(generics.ListAPIView):
    """
    GET /api/events/
    Returns all active events.
    Supports filtering by category, is_free, is_online.

    Security:
    - Read only — no authentication required
    - Rate limited via DEFAULT_THROTTLE_CLASSES
    """
    serializer_class = EventSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    )
    filterset_fields = ('category', 'is_free', 'is_online')
    search_fields = (
        'listing__title',
        'listing__description',
        'listing__location',
        'venue',
        'organiser',
    )
    ordering_fields = ('event_date', 'listing__created_at')
    ordering = ('event_date',)

    def get_queryset(self):
        queryset = Event.objects.filter(
            listing__status='active'
        ).select_related('listing', 'listing__user')

        # Filter upcoming or past events
        upcoming = self.request.query_params.get('upcoming')
        if upcoming == 'true':
            from django.utils import timezone
            queryset = queryset.filter(
                event_date__gte=timezone.now()
            )

        return queryset


class EventCreateView(generics.CreateAPIView):
    """
    POST /api/events/create/
    Creates event details attached to an existing listing.

    Security:
    - Must be authenticated
    - Listing must belong to the logged in user
    - Listing must be of type event
    - Prevents duplicate event details
    """
    serializer_class = EventSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(
                pk=listing_id,
                user=self.request.user,
                listing_type='event'
            )
        except Listing.DoesNotExist:
            raise PermissionDenied(
                'Listing not found, not yours, or not an event.'
            )

        if hasattr(listing, 'event_detail'):
            raise PermissionDenied(
                'This listing already has event details.'
            )

        serializer.save(listing=listing)


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/events/<id>/  — view single event
    PATCH  /api/events/<id>/  — update (owner only)
    DELETE /api/events/<id>/  — delete (owner only)

    Security:
    - Read: anyone
    - Write: owner only
    """
    serializer_class = EventSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        return Event.objects.select_related(
            'listing', 'listing__user'
        )

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.listing.user != request.user:
                raise PermissionDenied(
                    'You do not own this listing.'
                )


class EventDetailByListingView(generics.RetrieveAPIView):
    """
    GET /api/events/listing/<listing_id>/
    Fetches event detail by parent listing ID.
    Used after creating to redirect to detail page.
    """
    serializer_class = EventSerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self):
        listing_id = self.kwargs['listing_id']
        try:
            return Event.objects.select_related(
                'listing', 'listing__user'
            ).get(listing__id=listing_id)
        except Event.DoesNotExist:
            raise NotFound('Event not found.')