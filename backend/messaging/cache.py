import logging
from django.core.cache import cache

logger = logging.getLogger(__name__)

_KEY = "unread:{}"
_TTL = 86400  # 24 hours


def get_cached_unread(user_id):
    try:
        return cache.get(_KEY.format(user_id))
    except Exception:
        return None


def set_cached_unread(user_id, count):
    try:
        cache.set(_KEY.format(user_id), max(0, count), _TTL)
    except Exception:
        pass


def bump_unread(user_id):
    """Increment by 1 only when the key is already warm; miss means next poll will re-warm from DB."""
    try:
        val = cache.get(_KEY.format(user_id))
        if val is not None:
            cache.set(_KEY.format(user_id), val + 1, _TTL)
    except Exception as e:
        logger.warning("bump_unread failed for user %s: %s", user_id, e)


def invalidate_unread(user_id):
    try:
        cache.delete(_KEY.format(user_id))
    except Exception:
        pass
