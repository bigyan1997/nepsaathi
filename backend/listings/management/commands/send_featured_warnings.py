from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from listings.models import Listing


class Command(BaseCommand):
    help = 'Send expiry warning emails for featured listings ending within 24 hours'

    def handle(self, *args, **options):
        now = timezone.now()
        window_end = now + timedelta(hours=28)  # 28h window catches any cron timing drift

        listings = Listing.objects.filter(
            is_featured=True,
            featured_warning_sent=False,
            featured_until__gt=now,
            featured_until__lte=window_end,
        ).select_related('user')

        self.stdout.write(f'Found {listings.count()} featured listings expiring within 24 hours...')

        for listing in listings:
            try:
                from core.emails import send_featured_expiry_warning_email
                send_featured_expiry_warning_email(listing)
                listing.featured_warning_sent = True
                listing.save(update_fields=['featured_warning_sent'])
                self.stdout.write(f'  ✓ Warning sent: {listing.title}')
            except Exception as e:
                self.stdout.write(f'  ✗ Failed for {listing.title}: {e}')

        self.stdout.write('Done!')
