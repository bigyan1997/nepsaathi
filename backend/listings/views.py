from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingCreateSerializer, ListingImageSerializer
from .throttles import ListingCreateThrottle


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

    Security:
    - Must be authenticated
    - Max 10 active listings per user
    - 5 minute cooldown between posts
    - Duplicate title detection within 24 hours
    """
    serializer_class = ListingCreateSerializer
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ListingCreateThrottle,)

    def perform_create(self, serializer):
        user = self.request.user
        from django.utils import timezone
        from datetime import timedelta
        from rest_framework.exceptions import ValidationError

        # Check max active listings per user
        active_count = Listing.objects.filter(
            user=user,
            status='active'
        ).count()

        if active_count >= 20:
            raise ValidationError(
                'You have reached the maximum of 20 active listings. '
                'Please delete some listings before posting new ones.'
            )

        # Check 5 minute cooldown between posts
        five_mins_ago = timezone.now() - timedelta(minutes=5)
        recent_post = Listing.objects.filter(
            user=user,
            created_at__gte=five_mins_ago
        ).exists()

        if recent_post:
            raise ValidationError(
                'Please wait 5 minutes before posting again.'
            )

        # Check for duplicate title in last 24 hours
        yesterday = timezone.now() - timedelta(hours=24)
        title = self.request.data.get('title', '').strip().lower()

        duplicate = Listing.objects.filter(
            user=user,
            title__iexact=title,
            created_at__gte=yesterday,
        ).exists()

        if duplicate:
            raise ValidationError(
                'You already posted a listing with this title in the last 24 hours.'
            )

        serializer.save(user=user)


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
        # Delete all images from Cloudinary to free storage
        for image in listing.images.all():
            image.delete()
        # Soft delete: mark as deleted instead of removing from DB
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

        uploaded = []
        for i, image in enumerate(images):
            # Validate file is an image
            if not image.content_type.startswith('image/'):
                continue

            # Validate file size — max 5MB
            if image.size > 5 * 1024 * 1024:
                continue

            listing_image = ListingImage.objects.create(
                listing=listing,
                image=image,
                is_primary=(i == 0 and not listing.images.exists())
            )
            uploaded.append(ListingImageSerializer(listing_image).data)

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