from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from listings.models import Listing

DEFAULT_DAYS = 7


class Command(BaseCommand):
    help = 'Clear is_featured on listings whose featured_until date has passed'

    def handle(self, *args, **options):
        now = timezone.now()

        # Listings with an explicit expiry date that has passed
        by_date = Listing.objects.filter(is_featured=True, featured_until__lt=now)
        count = by_date.update(is_featured=False)

        # Listings featured before featured_until existed (NULL) — expire after DEFAULT_DAYS
        # using updated_at as a proxy for when they were featured
        cutoff = now - timedelta(days=DEFAULT_DAYS)
        legacy = Listing.objects.filter(
            is_featured=True,
            featured_until__isnull=True,
            updated_at__lt=cutoff,
        )
        legacy_count = legacy.update(is_featured=False)

        total = count + legacy_count
        if total:
            self.stdout.write(self.style.SUCCESS(
                f'Unfeatured {total} listing(s) ({count} by date, {legacy_count} legacy).'
            ))
        else:
            self.stdout.write('No featured listings to expire.')
