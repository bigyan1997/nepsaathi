from django.core.management.base import BaseCommand
from django.utils import timezone
from listings.models import Listing


class Command(BaseCommand):
    help = 'Expire listings that have passed their expiry date'

    def handle(self, *args, **options):
        now = timezone.now()

        # Find active listings that have expired
        expired = Listing.objects.filter(
            status='active',
            expires_at__lt=now,
        )

        count = expired.count()

        if count == 0:
            self.stdout.write('No listings to expire.')
            return

        # Update status to expired
        expired.update(status='expired')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully expired {count} listings.'
            )
        )

