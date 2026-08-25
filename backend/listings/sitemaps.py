from django.contrib.sitemaps import Sitemap
from django.db.models import Q
from django.utils import timezone
from .models import Listing

TYPE_TO_PATH = {
    'job': 'jobs',
    'room': 'rooms',
    'event': 'events',
    'notice': 'notices',
}


class ListingSitemap(Sitemap):
    changefreq = "daily"
    priority = 0.7
    protocol = "https"

    def items(self):
        now = timezone.now()
        return (
            Listing.objects
            .filter(status='active', is_under_review=False)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .filter(listing_type__in=TYPE_TO_PATH.keys())
            .order_by('-updated_at')
        )

    def location(self, obj):
        return f"/{TYPE_TO_PATH[obj.listing_type]}/{obj.slug}"

    def lastmod(self, obj):
        return obj.updated_at
