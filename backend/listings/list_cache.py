"""
Per-query Redis cache for public listing list endpoints.

Strategy: each listing type has a "generation" counter in cache.
The counter is baked into every cache key for that type.
Invalidation = increment the counter; old keys become unreachable and
expire naturally after TTL without any need to enumerate them.

Only anonymous requests are cached — authenticated responses may carry
user-specific data (saved status, ownership flags, etc.).
"""
import hashlib
import logging

from django.core.cache import cache
from rest_framework.response import Response

logger = logging.getLogger(__name__)

TTL = 120          # seconds cached responses are served without hitting the DB
GEN_TTL = 86400    # generation counter survives 24 h; reset is harmless


def _gen_key(listing_type: str) -> str:
    return f"ll_gen:{listing_type}"


def _get_gen(listing_type: str) -> int:
    val = cache.get(_gen_key(listing_type))
    if val is None:
        cache.set(_gen_key(listing_type), 0, GEN_TTL)
        return 0
    return val


def build_key(listing_type: str, query_params) -> str:
    gen = _get_gen(listing_type)
    params_str = "&".join(f"{k}={v}" for k, v in sorted(query_params.items()))
    params_hash = hashlib.md5(params_str.encode()).hexdigest()[:16]
    return f"ll:{listing_type}:g{gen}:{params_hash}"


def invalidate(listing_type: str) -> None:
    """Bump generation so all cached pages for this type are immediately unreachable."""
    try:
        key = _gen_key(listing_type)
        old = cache.get(key, 0)
        cache.set(key, old + 1, GEN_TTL)
        logger.debug("listing list cache invalidated: %s (gen %d → %d)", listing_type, old, old + 1)
    except Exception as exc:
        logger.warning("listing list cache invalidation failed for %s: %s", listing_type, exc)


class CachedListMixin:
    """
    Mix into a ListAPIView to cache anonymous GET responses for `listing_cache_type`.

    Usage::

        class JobListView(CachedListMixin, generics.ListAPIView):
            listing_cache_type = "job"
            ...
    """
    listing_cache_type: str | None = None

    def list(self, request, *args, **kwargs):
        if request.user.is_authenticated or not self.listing_cache_type:
            return super().list(request, *args, **kwargs)

        key = build_key(self.listing_cache_type, request.query_params)
        cached = cache.get(key)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        try:
            cache.set(key, response.data, TTL)
        except Exception as exc:
            logger.warning("listing list cache set failed for %s: %s", self.listing_cache_type, exc)
        return response
