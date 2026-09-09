import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

_firebase_app = None


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    try:
        import firebase_admin
        from firebase_admin import credentials
        sa_json = getattr(settings, 'FIREBASE_SERVICE_ACCOUNT_JSON', None)
        if not sa_json:
            return None
        cred_dict = json.loads(sa_json)
        cred = credentials.Certificate(cred_dict)
        _firebase_app = firebase_admin.initialize_app(cred)
    except Exception as e:
        logger.warning('Firebase init failed: %s', e)
        _firebase_app = None
    return _firebase_app


def send_fcm_notification(user, title, body, url='/messages'):
    """Send FCM push notification to all of a user's Android devices."""
    app = _get_firebase_app()
    if app is None:
        return
    try:
        from firebase_admin import messaging
    except ImportError:
        return

    tokens = list(user.fcm_tokens.values_list('token', flat=True))
    if not tokens:
        return

    stale = []
    for token in tokens:
        try:
            messaging.send(messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={'url': url},
                android=messaging.AndroidConfig(priority='high'),
                token=token,
            ))
        except messaging.UnregisteredError:
            stale.append(token)
        except Exception as e:
            logger.warning('FCM send failed for user %s: %s', user.id, e)

    if stale:
        from users.models import FcmToken
        FcmToken.objects.filter(token__in=stale).delete()


def send_push_notification(user, title, body, url='/messages'):
    """Send push notification via Web Push (browser) and FCM (Android)."""
    # FCM for native Android
    send_fcm_notification(user, title, body, url)

    # Web Push for browsers
    if not settings.VAPID_PRIVATE_KEY:
        return
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        logger.warning('pywebpush not installed — skipping web push notification')
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
                ttl=0,
                headers={'urgency': 'high'},
                timeout=10,
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
