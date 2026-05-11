from rest_framework import generics, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from listings.throttles import BusinessCreateThrottle
from .models import Business, BusinessImage, BusinessReport, BusinessReview
from .serializers import BusinessImageSerializer, BusinessSerializer, BusinessReviewSerializer


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
    )
    search_fields = (
        'business_name',
        'description',
        'suburb',
        'address',
        'state',
    )
    ordering_fields = ('created_at', 'business_name')
    ordering = ('-is_featured', '-is_verified', '-created_at')

    def get_queryset(self):
        return Business.objects.filter(
            is_active=True
        ).select_related('owner').prefetch_related('images')


class BusinessCreateView(generics.CreateAPIView):
    """
    POST /api/businesses/create/
    Register a new business.
    Throttled: 3 requests per hour per user.
    """
    serializer_class = BusinessSerializer
    permission_classes = (permissions.IsAuthenticated,)
    throttle_classes = (BusinessCreateThrottle,)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_banned:
            raise ValidationError('Your account has been suspended.')

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
        state = self.request.data.get('state', '').strip()
        duplicate = Business.objects.filter(
            business_name__iexact=business_name,
            state=state,
            is_active=True,
        ).exclude(owner=user).exists()
        if duplicate:
            raise ValidationError(
                f'A business named "{business_name}" is already registered in {state} on NepSaathi.'
            )

        business = serializer.save(owner=user)
        try:
            from core.emails import send_business_saved_search_alert_email
            _trigger_business_saved_search_alerts(business, send_business_saved_search_alert_email)
        except Exception:
            pass


def _trigger_business_saved_search_alerts(business, send_fn):
    import threading

    def _run():
        from listings.models import SavedSearch
        searches = SavedSearch.objects.filter(
            listing_type='business',
            is_active=True,
        ).exclude(user=business.owner).select_related('user')

        for saved in searches:
            try:
                f = saved.filters or {}
                keyword = f.get('search', '').lower()
                if keyword:
                    words = [w for w in keyword.split() if len(w) > 1]
                    text = f"{business.business_name} {business.description or ''}".lower()
                    if words and not all(w in text for w in words):
                        continue
                if f.get('state') and f['state'] != business.state:
                    continue
                if f.get('category') and f['category'] != business.category:
                    continue
                send_fn(saved.user, business, saved.id)
                from django.utils import timezone as tz
                saved.last_notified = tz.now()
                saved.save(update_fields=['last_notified'])
            except Exception as e:
                print(f'[BIZ SEARCH ALERT] Search #{saved.id} failed: {e}', flush=True)

    threading.Thread(target=_run, daemon=True).start()


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
    lookup_field = 'slug'

    def get_queryset(self):
        return Business.objects.select_related('owner').prefetch_related('images')

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
        ).select_related('owner').prefetch_related('images')


class BusinessReviewListCreateView(APIView):
    """
    GET  /api/businesses/<pk>/reviews/ — list reviews for a business
    POST /api/businesses/<pk>/reviews/ — submit a review (authenticated, not owner, one per business)
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, slug):
        try:
            business = Business.objects.get(slug=slug, is_active=True)
        except Business.DoesNotExist:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)
        reviews = business.reviews.select_related('reviewer').all()
        serializer = BusinessReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, slug):
        try:
            business = Business.objects.get(slug=slug, is_active=True)
        except Business.DoesNotExist:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)

        if business.owner == request.user:
            return Response(
                {'detail': 'You cannot review your own business.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if BusinessReview.objects.filter(business=business, reviewer=request.user).exists():
            return Response(
                {'detail': 'You have already reviewed this business.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BusinessReviewSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(business=business, reviewer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BusinessReviewDeleteView(APIView):
    """
    DELETE /api/businesses/<pk>/reviews/<review_pk>/ — delete own review
    """
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, slug, review_pk):
        try:
            review = BusinessReview.objects.get(pk=review_pk, business__slug=slug, reviewer=request.user)
        except BusinessReview.DoesNotExist:
            return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)
        review.delete()
        return Response({'detail': 'Review deleted.'}, status=status.HTTP_200_OK)


class BusinessImageUploadView(APIView):
    """
    POST   /api/businesses/<slug>/images/  — upload images (owner only, max 5)
    DELETE /api/businesses/<slug>/images/  — delete an image (owner only)
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, slug):
        try:
            business = Business.objects.get(slug=slug, owner=request.user)
        except Business.DoesNotExist:
            return Response(
                {'detail': 'Business not found or you do not own it.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        existing_count = business.images.count()
        if existing_count >= 5:
            return Response(
                {'detail': 'Maximum 5 images per business.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {'detail': 'No images provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        remaining = 5 - existing_count
        images = images[:remaining]

        has_existing = business.images.exists()
        uploaded = []
        for i, image in enumerate(images):
            if not image.content_type.startswith('image/'):
                continue
            if image.size > 5 * 1024 * 1024:
                continue
            biz_image = BusinessImage.objects.create(
                business=business,
                image=image,
                is_primary=(i == 0 and not has_existing),
            )
            uploaded.append(BusinessImageSerializer(biz_image).data)

        return Response(uploaded, status=status.HTTP_201_CREATED)

    def delete(self, request, slug):
        image_id = request.data.get('image_id')
        try:
            image = BusinessImage.objects.get(
                pk=image_id,
                business__slug=slug,
                business__owner=request.user,
            )
            image.delete()
            return Response({'detail': 'Image deleted.'}, status=status.HTTP_200_OK)
        except BusinessImage.DoesNotExist:
            return Response(
                {'detail': 'Image not found or you do not own it.'},
                status=status.HTTP_404_NOT_FOUND,
            )


class ReportBusinessView(APIView):
    """
    POST /api/businesses/<pk>/report/
    Report a business for spam, fake content, etc.
    """
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, slug):
        try:
            business = Business.objects.get(slug=slug)
        except Business.DoesNotExist:
            return Response({'detail': 'Business not found.'}, status=status.HTTP_404_NOT_FOUND)

        if business.owner == request.user:
            return Response({'detail': 'You cannot report your own business.'}, status=status.HTTP_400_BAD_REQUEST)

        if BusinessReport.objects.filter(user=request.user, business=business).exists():
            return Response({'detail': 'You have already reported this business.'}, status=status.HTTP_400_BAD_REQUEST)

        import zoneinfo
        from django.utils import timezone
        sydney_tz = zoneinfo.ZoneInfo('Australia/Sydney')
        today_start = timezone.now().astimezone(sydney_tz).replace(hour=0, minute=0, second=0, microsecond=0)
        if BusinessReport.objects.filter(user=request.user, created_at__gte=today_start).count() >= 5:
            return Response({'detail': 'You have reached the maximum of 5 reports per day.'}, status=status.HTTP_400_BAD_REQUEST)

        report = BusinessReport.objects.create(
            user=request.user,
            business=business,
            reason=request.data.get('reason', 'spam'),
            details=request.data.get('details', ''),
        )
        try:
            from core.emails import send_business_report_emails
            send_business_report_emails(report)
        except Exception as e:
            print(f'Business report email failed: {e}', flush=True)
        return Response({'detail': 'Report submitted. Thank you for keeping NepSaathi safe!'}, status=status.HTTP_201_CREATED)