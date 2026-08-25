from django.contrib.sitemaps import Sitemap
from .models import Business


class BusinessSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.6
    protocol = "https"

    def items(self):
        return Business.objects.filter(is_active=True).order_by('-updated_at')

    def location(self, obj):
        return f"/businesses/{obj.slug}"

    def lastmod(self, obj):
        return obj.updated_at
