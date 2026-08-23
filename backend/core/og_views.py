from html import escape
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from decouple import config
from users.throttles import OGPreviewThrottle

CANONICAL_BASE = "https://www.nepsaathi.com"
DEFAULT_IMAGE = f"{CANONICAL_BASE}/og-image.png"
DEFAULT_TITLE = "NepSaathi — Your Nepali friend, wherever you are"
DEFAULT_DESC = "Find jobs, rooms, events and businesses for Nepalese Australians. Free to use."

_TYPE_TO_PATH = {
    "job": "jobs",
    "room": "rooms",
    "event": "events",
    "notice": "notices",
}


def _render(title, description, image, canonical_url):
    t = escape(title[:120])
    d = escape(description[:200])
    img = escape(image)
    u = escape(canonical_url)
    # No redirect — crawlers read meta tags from this response and stop.
    # A meta-refresh back to the same URL causes a redirect loop via Vercel's bot routing.
    return HttpResponse(
        f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{t}</title>
<meta name="description" content="{d}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{u}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="NepSaathi">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@NepSaathi">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{img}">
</head>
<body>
<p><a href="{u}">{t}</a></p>
</body>
</html>""",
        content_type="text/html; charset=utf-8",
    )


class OGListingView(APIView):
    """OG prerender for job/room/event/notice listing pages (social bot traffic only)."""
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (OGPreviewThrottle,)

    def get(self, request, listing_type, slug):
        from listings.models import Listing, ListingImage

        path = _TYPE_TO_PATH.get(listing_type, f"{listing_type}s")
        canonical = f"{CANONICAL_BASE}/{path}/{slug}"
        title, description, image = DEFAULT_TITLE, DEFAULT_DESC, DEFAULT_IMAGE

        try:
            listing = Listing.objects.get(slug=slug, listing_type=listing_type, status='active')
            title = f"{listing.title} — NepSaathi"
            if listing.description:
                description = listing.description[:200]

            img_qs = ListingImage.objects.filter(listing=listing)
            primary = img_qs.filter(is_primary=True).first() or img_qs.first()
            if primary and primary.image:
                image = primary.image.url
        except Exception:
            pass

        return _render(title, description, image, canonical)


class OGBusinessView(APIView):
    """OG prerender for business detail pages (social bot traffic only)."""
    permission_classes = (permissions.AllowAny,)
    throttle_classes = (OGPreviewThrottle,)

    def get(self, request, slug):
        from businesses.models import Business, BusinessImage

        canonical = f"{CANONICAL_BASE}/businesses/{slug}"
        title, description, image = DEFAULT_TITLE, DEFAULT_DESC, DEFAULT_IMAGE

        try:
            business = Business.objects.get(slug=slug, is_active=True)
            title = f"{business.business_name} — NepSaathi"
            if business.description:
                description = business.description[:200]

            img_qs = BusinessImage.objects.filter(business=business)
            primary = img_qs.filter(is_primary=True).first() or img_qs.first()
            if primary and primary.image:
                image = primary.image.url
        except Exception:
            pass

        return _render(title, description, image, canonical)
