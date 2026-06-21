from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from listings.models import Listing


class Command(BaseCommand):
    help = 'Send expiry warning emails to listings expiring within 4 days (catches up if cron missed a day)'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        window_end = now + timedelta(days=4)

        listings = Listing.objects.filter(
            status='active',
            expiry_warning_sent=False,
            expires_at__gt=now,
            expires_at__lte=window_end,
        ).select_related('user')

        self.stdout.write(f'Found {listings.count()} listings expiring within 4 days...')

        for listing in listings:
            try:
                from core.emails import send_expiry_warning_email
                from core.push import send_push_notification
                # Mark first so a second cron run doesn't double-send even if push fails
                listing.expiry_warning_sent = True
                listing.save(update_fields=['expiry_warning_sent'])
                send_expiry_warning_email(listing)
                type_path = {
                    'job': 'jobs',
                    'room': 'rooms',
                    'event': 'events',
                    'notice': 'notices',
                }.get(listing.listing_type, 'listings')
                send_push_notification(
                    listing.user,
                    'Listing expiring soon',
                    f'"{listing.title}" expires in {(listing.expires_at - now).days + 1} days. Renew now to keep it active.',
                    f'/{type_path}/{listing.slug}',
                )
                self.stdout.write(f'  ✓ Sent warning for: {listing.title}')
            except Exception as e:
                self.stdout.write(f'  ✗ Failed for {listing.title}: {e}')

        self.stdout.write('Done!')
