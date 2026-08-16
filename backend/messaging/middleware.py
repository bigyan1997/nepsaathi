from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async


class JWTWebsocketMiddleware(BaseMiddleware):
    """
    Authenticates WebSocket connections via a short-lived one-time ticket
    (?ticket=) issued by /api/messages/ws-ticket/.  The ticket is stored in
    Django cache for 30 s and consumed on first use, so the JWT never appears
    in server logs or browser history.
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        ticket = params.get("ticket", [None])[0]
        scope["user"] = await self._get_user(ticket)
        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def _get_user(self, ticket):
        if not ticket:
            return AnonymousUser()
        try:
            from django.core.cache import cache
            from django.contrib.auth import get_user_model
            user_pk = cache.get(f'ws_ticket:{ticket}')
            if not user_pk:
                return AnonymousUser()
            cache.delete(f'ws_ticket:{ticket}')
            User = get_user_model()
            return User.objects.get(pk=user_pk)
        except Exception:
            return AnonymousUser()
