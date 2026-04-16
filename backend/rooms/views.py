from rest_framework import generics, permissions, filters
from rest_framework.exceptions import PermissionDenied, NotFound
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
        'listing__description',
        'listing__location',
        'listing__state',
    )
    ordering_fields = ('listing__created_at', 'price')
    ordering = ('-listing__created_at',)

    def get_queryset(self):
        queryset = Room.objects.filter(
            listing__status='active'
        ).select_related('listing', 'listing__user')

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        return queryset


class RoomCreateView(generics.CreateAPIView):
    """
    POST /api/rooms/create/
    Attaches room details to an existing listing.
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(
                pk=listing_id,
                user=self.request.user,
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
        listing_id = self.kwargs['listing_id']
        try:
            return Room.objects.select_related(
                'listing', 'listing__user'
            ).get(listing__id=listing_id)
        except Room.DoesNotExist:
            raise NotFound('Room not found.')