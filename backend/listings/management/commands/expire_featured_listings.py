from django.core.management.base import BaseCommand
from django.utils import timezone
from listings.models import Listing


class Command(BaseCommand):
    help = 'Clear is_featured on listings whose featured_until date has passed'

    def handle(self, *args, **options):
        now = timezone.now()
        expired = Listing.objects.filter(
            is_featured=True,
            featured_until__lt=now,
        )
        count = expired.update(is_featured=False)
        if count:
            self.stdout.write(self.style.SUCCESS(f'Unfeatured {count} listing(s).'))
        else:
            self.stdout.write('No featured listings to expire.')
