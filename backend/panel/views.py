from datetime import timedelta

from django.db.models import Count, Sum, Avg
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from businesses.models import Business, BusinessReport
from feedback.models import FeedbackResponse
from listings.models import Listing, ListingReport
from messaging.models import Conversation, Message
from payments.models import FeaturedPayment
from users.models import User


class IsSuperUser(BasePermission):
    message = 'Not found.'

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
            and request.user.is_superuser
        )


class AdminPanelStatsView(APIView):
    permission_classes = [IsSuperUser]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        six_months_ago = now - timedelta(days=180)

        # ── Overview counts ───────────────────────────────────────────────────
        total_users = User.objects.count()
        new_users_today = User.objects.filter(created_at__date=today).count()
        new_users_week = User.objects.filter(created_at__gte=now - timedelta(days=7)).count()
        banned_users = User.objects.filter(is_banned=True).count()
        verified_users = User.objects.filter(is_verified=True).count()

        active_listings = Listing.objects.filter(status='active').count()
        featured_listings = Listing.objects.filter(is_featured=True, status='active').count()
        under_review_listings = Listing.objects.filter(is_under_review=True).count()
        total_listings = Listing.objects.count()
        new_listings_week = Listing.objects.filter(created_at__gte=now - timedelta(days=7)).count()

        total_businesses = Business.objects.filter(is_active=True).count()
        verified_businesses = Business.objects.filter(is_verified=True).count()
        featured_businesses = Business.objects.filter(is_featured=True).count()

        pending_listing_reports = ListingReport.objects.filter(is_reviewed=False).count()
        pending_business_reports = BusinessReport.objects.filter(is_reviewed=False).count()

        total_conversations = Conversation.objects.count()
        total_messages = Message.objects.count()
        new_messages_week = Message.objects.filter(created_at__gte=now - timedelta(days=7)).count()

        revenue_data = FeaturedPayment.objects.filter(status='completed').aggregate(
            total=Sum('amount_paid'), count=Count('id')
        )
        total_revenue_cents = revenue_data['total'] or 0
        total_payments = revenue_data['count'] or 0

        # ── Time series — last 30 days ────────────────────────────────────────
        users_over_time = list(
            User.objects.filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        listings_over_time = list(
            Listing.objects.filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # ── Distributions ─────────────────────────────────────────────────────
        listings_by_type = dict(
            Listing.objects.filter(status='active')
            .values('listing_type')
            .annotate(count=Count('id'))
            .values_list('listing_type', 'count')
        )

        listings_by_state = dict(
            Listing.objects.filter(status='active')
            .values('state')
            .annotate(count=Count('id'))
            .values_list('state', 'count')
        )

        listings_by_status = dict(
            Listing.objects.values('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )

        businesses_by_category = dict(
            Business.objects.filter(is_active=True)
            .values('category')
            .annotate(count=Count('id'))
            .values_list('category', 'count')
        )

        # ── Revenue by month (last 6 months) ──────────────────────────────────
        revenue_by_month_qs = list(
            FeaturedPayment.objects.filter(
                status='completed',
                completed_at__gte=six_months_ago,
                completed_at__isnull=False,
            )
            .annotate(month=TruncMonth('completed_at'))
            .values('month')
            .annotate(total=Sum('amount_paid'), count=Count('id'))
            .order_by('month')
        )

        # ── Feedback summary ──────────────────────────────────────────────────
        feedback_qs = FeedbackResponse.objects.all()
        feedback_total = feedback_qs.count()
        feedback_avg = feedback_qs.aggregate(avg=Avg('satisfaction'))['avg']
        feedback_by_score = dict(
            feedback_qs.values('satisfaction')
            .annotate(count=Count('id'))
            .values_list('satisfaction', 'count')
        )

        # ── Pending reports ───────────────────────────────────────────────────
        pending_lr = list(
            ListingReport.objects.filter(is_reviewed=False)
            .select_related('user', 'listing')
            .order_by('-created_at')[:20]
            .values(
                'id', 'reason', 'details', 'created_at',
                'listing__id', 'listing__title', 'listing__slug', 'listing__listing_type',
                'user__email', 'user__first_name', 'user__last_name',
            )
        )

        pending_br = list(
            BusinessReport.objects.filter(is_reviewed=False)
            .select_related('user', 'business')
            .order_by('-created_at')[:20]
            .values(
                'id', 'reason', 'details', 'created_at',
                'business__id', 'business__business_name', 'business__slug',
                'user__email', 'user__first_name', 'user__last_name',
            )
        )

        # ── Recent payments ───────────────────────────────────────────────────
        recent_payments = list(
            FeaturedPayment.objects.select_related('user', 'listing', 'business')
            .order_by('-created_at')[:10]
            .values(
                'id', 'amount_paid', 'duration_days', 'status',
                'created_at', 'completed_at',
                'listing__title', 'listing__slug', 'listing__listing_type',
                'business__business_name', 'business__slug',
                'user__email', 'user__first_name', 'user__last_name',
            )
        )

        # ── Top listings by view count ────────────────────────────────────────
        top_listings = list(
            Listing.objects.filter(status='active')
            .annotate(view_count=Count('views'))
            .order_by('-view_count')[:10]
            .values(
                'id', 'title', 'slug', 'listing_type', 'state',
                'view_count', 'is_featured', 'created_at',
            )
        )

        # ── Recent signups ────────────────────────────────────────────────────
        recent_users = list(
            User.objects.order_by('-created_at')[:10]
            .values('id', 'email', 'first_name', 'last_name', 'is_verified', 'is_banned', 'created_at')
        )

        return Response({
            'overview': {
                'total_users': total_users,
                'new_users_today': new_users_today,
                'new_users_week': new_users_week,
                'banned_users': banned_users,
                'verified_users': verified_users,
                'active_listings': active_listings,
                'total_listings': total_listings,
                'new_listings_week': new_listings_week,
                'featured_listings': featured_listings,
                'under_review_listings': under_review_listings,
                'total_businesses': total_businesses,
                'verified_businesses': verified_businesses,
                'featured_businesses': featured_businesses,
                'pending_listing_reports': pending_listing_reports,
                'pending_business_reports': pending_business_reports,
                'total_conversations': total_conversations,
                'total_messages': total_messages,
                'new_messages_week': new_messages_week,
                'total_revenue_aud': round(total_revenue_cents / 100, 2),
                'total_payments': total_payments,
            },
            'users_over_time': [
                {'date': str(r['date']), 'count': r['count']}
                for r in users_over_time
            ],
            'listings_over_time': [
                {'date': str(r['date']), 'count': r['count']}
                for r in listings_over_time
            ],
            'listings_by_type': listings_by_type,
            'listings_by_state': listings_by_state,
            'listings_by_status': listings_by_status,
            'businesses_by_category': businesses_by_category,
            'revenue_by_month': [
                {
                    'month': r['month'].strftime('%b %Y'),
                    'total_aud': round(r['total'] / 100, 2),
                    'count': r['count'],
                }
                for r in revenue_by_month_qs
                if r.get('month') is not None
            ],
            'feedback': {
                'avg_score': round(feedback_avg, 2) if feedback_avg else None,
                'total_responses': feedback_total,
                'by_score': {str(k): v for k, v in sorted(feedback_by_score.items())},
            },
            'pending_listing_reports': pending_lr,
            'pending_business_reports': pending_br,
            'recent_payments': recent_payments,
            'top_listings': top_listings,
            'recent_users': recent_users,
        })
