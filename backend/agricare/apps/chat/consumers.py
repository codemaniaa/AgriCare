import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import Conversation, Message
from urllib.parse import parse_qs
User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket endpoint:
    ws://localhost:8000/ws/chat/<conversation_id>/?token=<JWT>
    """
    async def connect(self):
        
        try:
            self.conv_id = self.scope['url_route']['kwargs']['conversation_id']
            self.room_name = f'chat_{self.conv_id}'

            user = await self._get_user_from_token()
            print("USER:", user)
            
            if user is None:
                await self.close(code=4001)
                return

            is_participant = await self._is_participant(user, self.conv_id)

            if not is_participant:
                await self.close(code=4003)
                return

            self.user = user

            await self.channel_layer.group_add(
                self.room_name,
                self.channel_name
            )

            await self.accept()
            print("✅ CONNECTED SUCCESSFULLY")

        except Exception as e:
            print("🔥 CONNECT ERROR:", str(e))
            await self.close(code=1011)

    async def disconnect(self, close_code):
        print("❌ DISCONNECTED")

        if hasattr(self, 'room_name'):
            await self.channel_layer.group_discard(
                self.room_name,
                self.channel_name
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            content = data.get('message', '').strip()
        except (json.JSONDecodeError, KeyError):
            return

        if not content:
            return

        # 🔹 Save message in DB
        msg = await self._save_message(content)

        if not msg:
            return

        # 🔹 Broadcast message to group
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'chat_message',
                'id': msg.id,
                'message': content,
                'sender': self.user.username,
                'sender_id': self.user.id,
                'created_at': msg.created_at.isoformat(),
            }
        )

    async def chat_message(self, event):
        """Receive message from group"""
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['message'],
            'sender': event['sender'],
            'sender_id': event['sender_id'],
            'created_at': event['created_at'],
        }))

    # ───────────── Helpers ─────────────
    async def _get_user_from_token(self):
        query_string = self.scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token_str = params.get('token', [None])[0]
        print("TOKEN:", token_str)

        if not token_str:
            print("❌ No token provided")
            return None

        try:
            token = AccessToken(token_str)
            user = await database_sync_to_async(User.objects.get)(id=token['user_id'])
            return user
        except InvalidToken:
            print("❌ Invalid token")
            return None
        except TokenError as e:
            print("❌ Token error:", e)
            return None
        except User.DoesNotExist:
            print("❌ User not found")
            return None         
            
 
    @database_sync_to_async
    def _is_participant(self, user, conv_id):
        try:
            return Conversation.objects.filter(id=conv_id, participants=user).exists()
        except Exception as e:
            print("❌ _is_participant error:", e)
        return False

    @database_sync_to_async
    def _save_message(self, content):
        try:
            conv = Conversation.objects.get(id=self.conv_id)

            msg = Message.objects.create(
                conversation=conv,
                sender=self.user,
                content=content
            )

            conv.save()
            return msg

        except Exception as e:
            print("🔥 SAVE ERROR:", e)
            return None
