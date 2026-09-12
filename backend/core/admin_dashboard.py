from django.utils import timezone
from datetime import timedelta


def dashboard_callback(request, context):
    from listings.models import Listing, ListingReport
    from users.models import User
    from payments.models import FeaturedPayment

    now = timezone.now()
    week_ago = now - timedelta(days=7)

    active = Listing.objects.filter(status='active').count()
    open_reports = ListingReport.objects.filter(is_reviewed=False).count()
    new_users = User.objects.filter(date_joined__gte=week_ago).count()
    revenue_cents = FeaturedPayment.objects.filter(
        created_at__gte=week_ago,
        status='completed',
    ).values_list('amount_paid', flat=True)
    revenue_total = sum(revenue_cents) / 100

    context['dashboard_stats'] = [
        {
            'label': 'Active Listings',
            'value': active,
            'icon': 'list_alt',
            'color': '#534AB7',
            'bg': '#EEEDFE',
        },
        {
            'label': 'Open Reports',
            'value': open_reports,
            'icon': 'flag',
            'color': '#B91C1C',
            'bg': '#FEE2E2',
        },
        {
            'label': 'New Users (7d)',
            'value': new_users,
            'icon': 'person_add',
            'color': '#1D9E75',
            'bg': '#E1F5EE',
        },
        {
            'label': 'Revenue (7d)',
            'value': f'A${revenue_total:.0f}',
            'icon': 'payments',
            'color': '#E87722',
            'bg': '#FFF1E0',
        },
    ]
    return context
