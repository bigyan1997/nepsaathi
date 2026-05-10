import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def send_push_notification(user, title, body, url='/messages'):
    """Send a Web Push notification to all of a user's registered browsers."""
    if not settings.VAPID_PRIVATE_KEY:
        return

    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning('pywebpush not installed — skipping push notification')
        return

    subscriptions = user.push_subscriptions.all()
    if not subscriptions.exists():
        return

    payload = json.dumps({'title': title, 'body': body, 'url': url})
    stale = []

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    'endpoint': sub.endpoint,
                    'keys': {'p256dh': sub.p256dh, 'auth': sub.auth},
                },
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={'sub': f'mailto:{settings.VAPID_ADMIN_EMAIL}'},
            )
        except WebPushException as e:
            status = e.response.status_code if e.response is not None else None
            if status in (404, 410):
                stale.append(sub.pk)
            else:
                logger.warning('Push failed for user %s (status %s): %s', user.id, status, e)
        except Exception as e:
            logger.warning('Push error for user %s: %s', user.id, e)

    if stale:
        from users.models import PushSubscription
        PushSubscription.objects.filter(pk__in=stale).delete()
