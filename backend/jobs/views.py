from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from listings.models import Listing
from listings.views import IsOwnerOrReadOnly
from .models import Job
from .serializers import JobSerializer


class JobListView(generics.ListAPIView):
    """
    GET /api/jobs/
    Returns all active job listings.
    Anyone can browse — no login needed.

    Filters:
        /api/jobs/?job_type=casual
        /api/jobs/?job_type=full_time
        /api/jobs/?is_urgent=true
        /api/jobs/?search=kitchen
    """
    serializer_class = JobSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter)
    filterset_fields = ('job_type', 'salary_type', 'is_urgent')
    search_fields = ('listing__title', 'listing__description', 'listing__location', 'company_name')
    ordering_fields = ('listing__created_at', 'salary')
    ordering = ('-listing__created_at',)

    def get_queryset(self):
        """
        Only return jobs where the base listing is active.
        select_related fetches the listing and user in one DB query
        instead of making separate queries for each job — much faster.
        """
        return Job.objects.filter(
            listing__status='active'
        ).select_related('listing', 'listing__user')


class JobCreateView(generics.CreateAPIView):
    """
    POST /api/jobs/
    Attaches job details to an existing listing.
    Must be logged in and must own the listing.

    Request body:
        {
            "listing": 1,
            "company_name": "Himalayan Cafe",
            "job_type": "casual",
            "salary": 23.50,
            "salary_type": "hourly",
            "is_urgent": false
        }
    """
    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def perform_create(self, serializer):
        """
        Before saving, verify the listing belongs to the logged in user.
        This prevents users from attaching job details to someone else's listing.
        """
        listing_id = self.request.data.get('listing')
        try:
            listing = Listing.objects.get(
                pk=listing_id,
                user=self.request.user,
                listing_type='job'
            )
        except Listing.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
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
        """Only the listing owner can edit or delete."""
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.listing.user != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('You do not own this listing.')
            

class JobDetailByListingView(generics.RetrieveAPIView):
    """
    GET /api/jobs/listing/<listing_id>/
    Fetches job detail by the parent listing ID.
    React uses this after creating a listing to show the detail page.
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
            from rest_framework.exceptions import NotFound
            raise NotFound('Job not found.')