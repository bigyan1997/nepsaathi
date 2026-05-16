from rest_framework import generics, permissions, filters
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from listings.models import Listing
from .models import Room
from .serializers import RoomSerializer


class RoomListView(generics.ListAPIView):
    """
    GET /api/rooms/
    Returns all active room listings.
    Anyone can browse — no login needed.
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = (
        'room_type',
        'furnishing',
        'bills_included',
        'nepalese_household',
        'pets_allowed',
        'parking_available',
        'listing__state',
    )
    search_fields = (
        'listing__title',
        'listing__location',
        'listing__state',
    )
    ordering_fields = ('listing__created_at', 'price', 'listing__is_featured')
    ordering = ('-listing__is_featured', '-listing__created_at',)

    def get_queryset(self):
        from django.db.models import Count
        queryset = Room.objects.filter(
            listing__status='active',
            listing__is_under_review=False,
        ).select_related('listing', 'listing__user').prefetch_related(
            'listing__reports'
        ).annotate(
            view_count_annotated=Count('listing__views')
        )
        params = self.request.query_params
        try:
            if params.get('min_price'):
                queryset = queryset.filter(price__gte=float(params['min_price']))
            if params.get('max_price'):
                queryset = queryset.filter(price__lte=float(params['max_price']))
            if params.get('min_bedrooms'):
                queryset = queryset.filter(bedrooms__gte=int(params['min_bedrooms']))
        except (ValueError, TypeError):
            pass
        return queryset


class RoomCreateView(generics.CreateAPIView):
    """
    POST /api/rooms/create/
    Attaches room details to an existing listing.
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_banned:
            raise ValidationError('Your account has been suspended.')
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(
                pk=listing_id,
                user=user,
                listing_type='room'
            )
        except Listing.DoesNotExist:
            raise PermissionDenied(
                'Listing not found, not yours, or not a room listing.'
            )
        serializer.save(listing=listing)


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/rooms/<id>/  — view single room detail
    PATCH  /api/rooms/<id>/  — update room detail (owner only)
    DELETE /api/rooms/<id>/  — delete room detail (owner only)
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        return Room.objects.select_related('listing', 'listing__user')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.listing.user != request.user:
                raise PermissionDenied('You do not own this listing.')


class RoomDetailByListingView(generics.RetrieveAPIView):
    """
    GET /api/rooms/listing/<listing_id>/
    Fetches room detail by the parent listing ID.
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self):
        listing_slug = self.kwargs['listing_slug']
        try:
            return Room.objects.select_related(
                'listing', 'listing__user'
            ).get(listing__slug=listing_slug)
        except Room.DoesNotExist:
            raise NotFound('Room not found.')