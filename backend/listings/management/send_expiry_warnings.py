from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from listings.models import Listing


class Command(BaseCommand):
    help = 'Send expiry warning emails to listings expiring in 3 days'

    def handle(self, *args, **kwargs):
        warning_date = timezone.now() + timedelta(days=3)
        start = warning_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end = warning_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        listings = Listing.objects.filter(
            status='active',
            expires_at__range=(start, end)
        )

        self.stdout.write(f'Found {listings.count()} listings expiring in 3 days...')

        for listing in listings:
            try:
                from core.emails import send_expiry_warning_email
                send_expiry_warning_email(listing)
                self.stdout.write(f'  ✓ Sent warning for: {listing.title}')
            except Exception as e:
                self.stdout.write(f'  ✗ Failed for {listing.title}: {e}')

        self.stdout.write('Done!')