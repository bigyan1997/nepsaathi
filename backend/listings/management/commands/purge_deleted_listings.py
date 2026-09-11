from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from listings.models import Listing


class Command(BaseCommand):
    help = 'Hard-delete listings that have been soft-deleted for more than 30 days'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=30)

        qs = Listing.objects.filter(
            status='deleted',
            updated_at__lt=cutoff,
        )

        count = qs.count()
        if count == 0:
            self.stdout.write('No listings to purge.')
            return

        qs.delete()
        self.stdout.write(self.style.SUCCESS(f'Purged {count} deleted listing(s) older than 30 days.'))
