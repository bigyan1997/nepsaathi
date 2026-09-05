from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from listings.models import Listing

DEFAULT_DAYS = 7


class Command(BaseCommand):
    help = 'Clear is_featured on listings whose featured_until date has passed, then email owners'

    def handle(self, *args, **options):
        now = timezone.now()

        # Listings with an explicit expiry date that has passed
        by_date = list(
            Listing.objects.filter(is_featured=True, featured_until__lt=now).select_related('user')
        )

        # Legacy: featured before featured_until existed (NULL) — expire after DEFAULT_DAYS by updated_at
        cutoff = now - timedelta(days=DEFAULT_DAYS)
        legacy = list(
            Listing.objects.filter(
                is_featured=True,
                featured_until__isnull=True,
                updated_at__lt=cutoff,
            ).select_related('user')
        )

        all_expired = by_date + legacy
        total = len(all_expired)

        if not total:
            self.stdout.write('No featured listings to expire.')
            return

        from core.emails import send_featured_removed_email

        for listing in all_expired:
            listing.is_featured = False
            listing.featured_warning_sent = False  # reset so next feature cycle can warn again
            listing.save(update_fields=['is_featured', 'featured_warning_sent'])
            try:
                send_featured_removed_email(listing)
                self.stdout.write(f'  ✓ Unfeatured + emailed: {listing.title}')
            except Exception as e:
                self.stdout.write(f'  ⚠ Unfeatured but email failed for {listing.title}: {e}')

        self.stdout.write(self.style.SUCCESS(
            f'Unfeatured {total} listing(s) ({len(by_date)} by date, {len(legacy)} legacy).'
        ))
