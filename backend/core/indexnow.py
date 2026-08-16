import threading
import logging
import requests
from decouple import config

logger = logging.getLogger(__name__)

INDEXNOW_KEY = config('INDEXNOW_KEY', default='')
FRONTEND_URL = config('FRONTEND_URL', default='https://www.nepsaathi.com')


def _ping(url):
    if not INDEXNOW_KEY:
        return
    try:
        requests.post(
            "https://api.indexnow.org/indexnow",
            json={"host": "www.nepsaathi.com", "key": INDEXNOW_KEY, "urlList": [url]},
            timeout=5,
        )
    except Exception as e:
        logger.debug("IndexNow ping failed for %s: %s", url, e)


def ping_indexnow(path):
    """Fire-and-forget IndexNow ping. path should start with /."""
    url = f"{FRONTEND_URL}{path}"
    threading.Thread(target=_ping, args=(url,), daemon=True).start()
