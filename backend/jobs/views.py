from rest_framework import generics, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
from listings.models import Listing
from .models import Job, JobApplication
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
        'listing__location',
        'listing__state',
        'company_name',
    )
    ordering_fields = ('listing__created_at', 'salary', 'listing__is_featured')
    ordering = ('-listing__is_featured', '-listing__created_at',)

    def get_queryset(self):
        from django.db.models import Count
        qs = Job.objects.filter(
            listing__status='active',
            listing__is_under_review=False,
        ).select_related('listing', 'listing__user').prefetch_related(
            'listing__reports'
        ).annotate(
            view_count_annotated=Count('listing__views')
        )
        params = self.request.query_params
        min_salary = params.get('min_salary')
        max_salary = params.get('max_salary')
        if min_salary:
            try:
                qs = qs.filter(salary__gte=float(min_salary))
            except ValueError:
                pass
        if max_salary:
            try:
                qs = qs.filter(salary__lte=float(max_salary))
            except ValueError:
                pass
        return qs


class JobCreateView(generics.CreateAPIView):
    """
    POST /api/jobs/create/
    Attaches job details to an existing listing.
    Must be logged in and must own the listing.
    """
    serializer_class = JobSerializer
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
        listing_slug = self.kwargs['listing_slug']
        try:
            return Job.objects.select_related(
                'listing', 'listing__user'
            ).get(listing__slug=listing_slug)
        except Job.DoesNotExist:
            raise NotFound('Job not found.')


class JobApplyView(APIView):
    """
    GET  /api/jobs/<id>/apply/  — check if current user has already applied
    POST /api/jobs/<id>/apply/  — submit an application (emails the job poster)
    """
    permission_classes = (permissions.IsAuthenticated,)

    def _get_job(self, pk):
        try:
            return Job.objects.select_related('listing', 'listing__user').get(pk=pk)
        except Job.DoesNotExist:
            raise NotFound('Job not found.')

    def get(self, request, pk):
        job = self._get_job(pk)
        applied = JobApplication.objects.filter(job=job, applicant=request.user).exists()
        return Response({'applied': applied})

    def post(self, request, pk):
        job = self._get_job(pk)

        if job.listing.status != 'active':
            raise ValidationError('This job listing is no longer active.')
        if job.listing.user == request.user:
            raise ValidationError('You cannot apply to your own listing.')
        if job.listing.is_wanted:
            raise ValidationError('This is a job-seeker post — contact them directly.')

        cover_letter = request.data.get('cover_letter', '').strip()
        if not cover_letter:
            raise ValidationError({'cover_letter': 'A cover letter is required.'})
        if len(cover_letter) > 2000:
            raise ValidationError({'cover_letter': 'Cover letter cannot exceed 2000 characters.'})

        _, created = JobApplication.objects.get_or_create(
            job=job,
            applicant=request.user,
            defaults={'cover_letter': cover_letter},
        )
        if not created:
            return Response({'detail': 'You have already applied to this job.'}, status=400)

        from core.emails import send_job_application_email
        send_job_application_email(poster=job.listing.user, applicant=request.user, job=job, cover_letter=cover_letter)

        return Response({'detail': 'Application submitted.'}, status=201)


class AIImproveCoverLetterView(APIView):
    """POST /api/jobs/ai-improve-cover-letter/ — rewrites a cover letter using Llama 3 via Groq."""
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = 'ai_improve'

    def post(self, request):
        import groq as groq_sdk
        from decouple import config

        cover_letter = (request.data.get('cover_letter') or '').strip()
        job_title = (request.data.get('job_title') or '').strip()
        company = (request.data.get('company_name') or '').strip()

        if not cover_letter or len(cover_letter) < 10:
            return Response({'error': 'Please write at least a few words first.'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = config('GROQ_API_KEY', default='')
        if not api_key:
            return Response({'error': 'AI service not configured.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        applicant_name = request.user.get_full_name() or request.user.email.split("@")[0]
        context = f"Job: {job_title}" + (f" at {company}" if company else "")
        prompt = f"""You are helping a Nepalese Australian write a professional job application cover letter on NepSaathi.

{context}
Applicant's full name: {applicant_name}

<applicant_draft>
{cover_letter}
</applicant_draft>

Rewrite the cover letter inside <applicant_draft> to be professional, concise, and compelling. Fix grammar and spelling. Keep all the facts the applicant wrote. Do not invent new information or qualifications. Keep it under 300 words. Sign off with the applicant's real name ({applicant_name}). Return only the improved cover letter — no preamble, no explanation."""

        try:
            client = groq_sdk.Groq(api_key=api_key)
            chat = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            import re as _re
            improved = chat.choices[0].message.content.strip()
            improved = _re.sub(r'</?applicant_draft>', '', improved).strip()
            return Response({'improved': improved})
        except groq_sdk.APIError as e:
            import logging
            logging.getLogger(__name__).error("Groq API error in cover letter ai-improve: %s", e)
            return Response({'error': 'AI service temporarily unavailable.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)