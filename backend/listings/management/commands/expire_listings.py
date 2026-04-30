from django.core.management.base import BaseCommand
from django.utils import timezone
from listings.models import Listing


class Command(BaseCommand):
    help = 'Expire listings that have passed their expiry date'

    def handle(self, *args, **options):
        now = timezone.now()

        expired = Listing.objects.filter(
            status='active',
            expires_at__lt=now,
        ).select_related('user')

        listings = list(expired)
        count = len(listings)

        if count == 0:
            self.stdout.write('No listings to expire.')
            return

        expired.update(status='expired')

        from core.emails import send_listing_expired_email
        for listing in listings:
            try:
                send_listing_expired_email(listing)
            except Exception as e:
                self.stderr.write(f'Email failed for listing {listing.id}: {e}')

        self.stdout.write(self.style.SUCCESS(f'Successfully expired {count} listings.'))

