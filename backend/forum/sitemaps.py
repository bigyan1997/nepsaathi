from django.contrib.sitemaps import Sitemap
from .models import ForumPost


class ForumPostSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.7
    protocol = "https"

    def items(self):
        return ForumPost.objects.order_by("-created_at")

    def location(self, obj):
        return f"/forum/{obj.slug}"

    def lastmod(self, obj):
        return obj.updated_at
