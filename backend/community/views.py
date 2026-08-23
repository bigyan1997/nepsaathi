from rest_framework import generics, permissions, filters
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import ReverseRequest, ServiceListing
from .serializers import ReverseRequestSerializer, ServiceListingSerializer


class ReverseRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = ReverseRequestSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['title', 'body']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = ReverseRequest.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        state    = self.request.query_params.get('state')
        if category:
            qs = qs.filter(category=category)
        if state:
            qs = qs.filter(state__iexact=state)
        return qs

    def perform_create(self, serializer):
        if self.request.user.is_banned:
            raise ValidationError('Your account has been suspended.')
        serializer.save(user=self.request.user)


class ReverseRequestDeleteView(generics.DestroyAPIView):
    serializer_class = ReverseRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ReverseRequest.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


class ServiceListingListCreateView(generics.ListCreateAPIView):
    serializer_class = ServiceListingSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ['title', 'description']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = ServiceListing.objects.filter(is_active=True)
        category = self.request.query_params.get('category')
        state    = self.request.query_params.get('state')
        if category:
            qs = qs.filter(category=category)
        if state:
            qs = qs.filter(state__iexact=state)
        return qs

    def perform_create(self, serializer):
        if self.request.user.is_banned:
            raise ValidationError('Your account has been suspended.')
        serializer.save(user=self.request.user)


class ServiceListingDeleteView(generics.DestroyAPIView):
    serializer_class = ServiceListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ServiceListing.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
