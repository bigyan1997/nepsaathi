from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async


class JWTWebsocketMiddleware(BaseMiddleware):
    """
    Authenticates WebSocket connections using a JWT token passed as
    ?token= query parameter (browser WS API doesn't support custom headers).
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token_list = params.get("token", [])
        scope["user"] = await self._get_user(token_list[0] if token_list else None)
        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def _get_user(self, token_str):
        if not token_str:
            return AnonymousUser()
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from django.contrib.auth import get_user_model
            User = get_user_model()
            validated = AccessToken(token_str)
            return User.objects.get(pk=validated["user_id"])
        except Exception:
            return AnonymousUser()
