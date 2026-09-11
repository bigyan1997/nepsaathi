import asyncio
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .models import Conversation

logger = logging.getLogger(__name__)

PING_INTERVAL = 10  # seconds — keeps Railway proxy from closing idle connections
MAX_CONNECTIONS_PER_USER = 5


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"conversation_{self.conversation_id}"
        self._conn_key = None

        if not await self._is_participant():
            await self.close(code=4003)
            return

        # Per-user connection cap — prevents connection-flood abuse
        user = self.scope.get("user")
        if user and user.is_authenticated:
            key = f"ws_conn:{user.id}"
            await cache.aadd(key, 0, 3600)
            count = await cache.aincr(key)
            if count > MAX_CONNECTIONS_PER_USER:
                await cache.adecr(key)
                await self.close(code=4029)
                return
            self._conn_key = key

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        self._ping_task = asyncio.ensure_future(self._ping_loop())

    async def disconnect(self, close_code):
        if hasattr(self, "_ping_task"):
            self._ping_task.cancel()
        if self._conn_key:
            try:
                await cache.adecr(self._conn_key)
            except Exception:
                pass
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def _ping_loop(self):
        try:
            while True:
                await asyncio.sleep(PING_INTERVAL)
                await self.send(text_data='{"type":"ping"}')
        except asyncio.CancelledError:
            pass
        except Exception:
            pass

    async def receive(self, text_data=None, bytes_data=None):
        # Client sends messages via HTTP; WS is receive-only
        pass

    async def chat_message(self, event):
        """Called by channel layer when a new message is broadcast."""
        logger.info("WS delivering to conversation %s", self.conversation_id)
        await self.send(text_data=json.dumps(event["message"]))

    @database_sync_to_async
    def _is_participant(self):
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            return False
        try:
            return Conversation.objects.filter(
                pk=self.conversation_id, participants=user
            ).exists()
        except Exception:
            return False
