import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Conversation


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"conversation_{self.conversation_id}"

        if not await self._is_participant():
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Client sends messages via HTTP; WS is receive-only
        pass

    async def chat_message(self, event):
        """Called by channel layer when a new message is broadcast."""
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
