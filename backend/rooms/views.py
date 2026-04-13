from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from listings.models import Listing
from .models import Room
from .serializers import RoomSerializer


class RoomListView(generics.ListAPIView):
    """
    GET /api/rooms/
    Returns all active room listings.
    Anyone can browse — no login needed.

    Filters:
        /api/rooms/?room_type=private
        /api/rooms/?bills_included=true
        /api/rooms/?nepalese_household=true
        /api/rooms/?search=parramatta
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
    )
    search_fields = (
        'listing__title',
        'listing__description',
        'listing__location',
    )
    ordering_fields = ('listing__created_at', 'price')
    ordering = ('-listing__created_at',)

    def get_queryset(self):
        """
        Only return rooms where the base listing is active.
        Also supports price range filtering via query params.

        Examples:
            /api/rooms/?min_price=100&max_price=300
        """
        queryset = Room.objects.filter(
            listing__status='active'
        ).select_related('listing', 'listing__user')

        # Price range filter
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
    Must be logged in and must own the listing.

    Request body:
        {
            "listing": 1,
            "room_type": "private",
            "price": 250.00,
            "furnishing": "furnished",
            "bills_included": true,
            "nepalese_household": true
        }
    """
    serializer_class = RoomSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        """
        Verify the listing belongs to the logged in user
        and is of type room before saving.
        """
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(
                pk=listing_id,
                user=self.request.user,
                listing_type='room'
            )
        except Listing.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
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
        """Only the listing owner can edit or delete."""
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.listing.user != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You do not own this listing.')