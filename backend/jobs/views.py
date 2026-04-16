from rest_framework import generics, permissions, filters
from rest_framework.exceptions import PermissionDenied, NotFound
from django_filters.rest_framework import DjangoFilterBackend
from listings.models import Listing
from .models import Job
from .serializers import JobSerializer


class JobListView(generics.ListAPIView):
    """
    GET /api/jobs/
    Returns all active job listings.
    Anyone can browse — no login needed.
    """
    serializer_class = JobSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('job_type', 'salary_type', 'is_urgent', 'listing__state')
    search_fields = (
        'listing__title',
        'listing__description',
        'listing__location',
        'listing__state',
        'company_name',
    )
    ordering_fields = ('listing__created_at', 'salary')
    ordering = ('-listing__created_at',)

    def get_queryset(self):
        return Job.objects.filter(
            listing__status='active'
        ).select_related('listing', 'listing__user')


class JobCreateView(generics.CreateAPIView):
    """
    POST /api/jobs/create/
    Attaches job details to an existing listing.
    Must be logged in and must own the listing.
    """
    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(
                pk=listing_id,
                user=self.request.user,
                listing_type='job'
            )
        except Listing.DoesNotExist:
            raise PermissionDenied(
                'Listing not found, not yours, or not a job listing.'
            )
        serializer.save(listing=listing)


class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/jobs/<id>/  — view single job detail
    PATCH  /api/jobs/<id>/  — update job detail (owner only)
    DELETE /api/jobs/<id>/  — delete job detail (owner only)
    """
    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)

    def get_queryset(self):
        return Job.objects.select_related('listing', 'listing__user')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.listing.user != request.user:
                raise PermissionDenied('You do not own this listing.')


class JobDetailByListingView(generics.RetrieveAPIView):
    """
    GET /api/jobs/listing/<listing_id>/
    Fetches job detail by the parent listing ID.
    """
    serializer_class = JobSerializer
    permission_classes = (permissions.AllowAny,)

    def get_object(self):
        listing_id = self.kwargs['listing_id']
        try:
            return Job.objects.select_related(
                'listing', 'listing__user'
            ).get(listing__id=listing_id)
        except Job.DoesNotExist:
            raise NotFound('Job not found.')