from rest_framework import generics, permissions, filters
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from .models import Business
from .serializers import BusinessSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Only the business owner can edit or delete.
    Anyone can read.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user


class BusinessListView(generics.ListAPIView):
    """
    GET /api/businesses/
    Returns all active verified and unverified businesses.
    Anyone can browse.

    Filters:
        /api/businesses/?category=restaurant
        /api/businesses/?state=NSW
        /api/businesses/?is_nepalese_owned=true
        /api/businesses/?is_verified=true
        /api/businesses/?search=himalayan
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
    Must be logged in — owner set automatically.

    Security:
    - Must be authenticated
    - Owner assigned from request.user automatically
    - is_verified always starts as False
    """
    serializer_class = BusinessSerializer
    permission_classes = (permissions.IsAuthenticated,)


class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/businesses/<id>/  — view single business
    PATCH  /api/businesses/<id>/  — update (owner only)
    DELETE /api/businesses/<id>/  — delete (owner only)

    Security:
    - Read: anyone
    - Write: owner only via IsOwnerOrReadOnly
    - is_verified cannot be changed by owner
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
        from rest_framework.response import Response
        from rest_framework import status
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