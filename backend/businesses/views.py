from rest_framework import generics, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Business
from .serializers import BusinessSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Only the business owner can edit or delete."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class BusinessListView(generics.ListAPIView):
    """
    GET /api/businesses/
    Returns all active businesses.
    """
    serializer_class = BusinessSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    )
    filterset_fields = (
        'category',
        'state',
        'is_nepalese_owned',
        'is_verified',
        'is_active',
    )
    search_fields = (
        'business_name',
        'description',
        'suburb',
        'address',
        'state',
    )
    ordering_fields = ('created_at', 'business_name')
    ordering = ('-is_verified', '-created_at')

    def get_queryset(self):
        return Business.objects.filter(
            is_active=True
        ).select_related('owner')


class BusinessCreateView(generics.CreateAPIView):
    """
    POST /api/businesses/create/
    Register a new business.
    """
    serializer_class = BusinessSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        user = self.request.user

        # Max 5 businesses per user
        business_count = Business.objects.filter(
            owner=user,
            is_active=True
        ).count()
        if business_count >= 5:
            raise ValidationError(
                'You can register a maximum of 5 businesses.'
            )

        # Check for duplicate business name (exclude own businesses)
        business_name = self.request.data.get('business_name', '').strip()
        duplicate = Business.objects.filter(
            business_name__iexact=business_name,
            is_active=True,
        ).exclude(owner=user).exists()

        if duplicate:
            raise ValidationError(
                f'A business named "{business_name}" is already registered on NepSaathi.'
            )

        serializer.save(owner=user)


class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/businesses/<id>/  — view single business
    PATCH  /api/businesses/<id>/  — update (owner only)
    DELETE /api/businesses/<id>/  — soft delete (owner only)
    """
    serializer_class = BusinessSerializer
    permission_classes = (
        permissions.IsAuthenticatedOrReadOnly,
        IsOwnerOrReadOnly,
    )

    def get_queryset(self):
        return Business.objects.select_related('owner')

    def destroy(self, request, *args, **kwargs):
        business = self.get_object()
        business.is_active = False
        business.save()
        return Response(
            {'detail': 'Business removed successfully.'},
            status=status.HTTP_200_OK
        )


class MyBusinessesView(generics.ListAPIView):
    """
    GET /api/businesses/my-businesses/
    Returns all businesses registered by the logged in user.
    """
    serializer_class = BusinessSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Business.objects.filter(
            owner=self.request.user
        ).select_related('owner')