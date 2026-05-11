import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from messaging.middleware import JWTWebsocketMiddleware
import messaging.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTWebsocketMiddleware(
        URLRouter(messaging.routing.websocket_urlpatterns)
    ),
})
