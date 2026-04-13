from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingCreateSerializer, ListingImageSerializer


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
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('listing_type', 'state', 'status', 'is_featured')
    search_fields = ('title', 'description', 'location')
    ordering_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)

    def get_queryset(self):
        return Listing.objects.filter(
            status='active'
        ).select_related('user').prefetch_related('images')


class ListingCreateView(generics.CreateAPIView):
    """
    POST /api/listings/create/
    Creates a new listing.
    Must be logged in — user is set automatically.
    """
    serializer_class = ListingCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/listings/<id>/  — view single listing
    PATCH  /api/listings/<id>/  — update listing (owner only)
    DELETE /api/listings/<id>/  — delete listing (owner only)
    """
    serializer_class = ListingSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly)

    def get_queryset(self):
        return Listing.objects.select_related('user').prefetch_related('images')

    def destroy(self, request, *args, **kwargs):
        listing = self.get_object()
        listing.status = 'deleted'
        listing.save()
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
        return Listing.objects.filter(
            user=self.request.user
        ).select_related('user').prefetch_related('images')


class ListingImageUploadView(APIView):
    """
    POST /api/listings/<id>/images/
    Upload images to a listing.
    Only the listing owner can upload images.
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

        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {'detail': 'No images provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded = []
        for i, image in enumerate(images):
            listing_image = ListingImage.objects.create(
                listing=listing,
                image=image,
                is_primary=(i == 0 and not listing.images.exists())
            )
            uploaded.append(ListingImageSerializer(listing_image).data)

        return Response(uploaded, status=status.HTTP_201_CREATED)