"""
Auction WebSocket Consumer
ws://host/ws/auction/<auction_id>/?token=<jwt>

Public connections allowed (no auth required to watch).
Auth required to place bids (handled in REST API).
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class AuctionConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.auction_id = self.scope['url_route']['kwargs']['auction_id']
        self.room_group  = f'auction_{self.auction_id}'

        # Verify auction exists and is active
        auction = await self._get_auction()
        if not auction:
            await self.close(code=4004)
            return

        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

        # Send current state immediately on connect
        await self.send(text_data=json.dumps({
            'type':          'auction_state',
            'auction_id':    self.auction_id,
            'current_price': float(auction.current_price),
            'total_bids':    auction.total_bids,
            'time_remaining': auction.time_remaining_seconds,
            'status':        auction.status,
            'highest_bidder': auction.highest_bidder.username if auction.highest_bidder else None,
        }))
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        """
        Client can send: {"type": "ping"} to keep connection alive.
        Actual bids are placed via REST API — WS is receive-only for state.
        """
        try:
            data = json.loads(text_data)
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    # ── Group message handlers ─────────────────────────

    async def bid_update(self, event):
        """Called when a new bid is broadcast via channel layer."""
        await self.send(text_data=json.dumps({
            'type':          'bid_update',
            'bid_id':        event.get('bid_id'),
            'bidder':        event.get('bidder'),
            'amount':        event.get('amount'),
            'current_price': event.get('current_price'),
            'total_bids':    event.get('total_bids'),
            'min_next_bid':  event.get('min_next_bid'),
            'timestamp':     event.get('timestamp'),
        }))

    async def auction_ended(self, event):
        await self.send_json({
            'type': 'AUCTION_ENDED',
            'winner': event.get('winner'),
            'winner_id': event.get('winner_id'),
            'final_price': event.get('final_price'),
            'message': event.get('message', 'Auction has ended.'),
        })

    # ── DB helpers ─────────────────────────────────────

    @database_sync_to_async
    def _get_auction(self):
        from agricare.apps.auctions.models import Auction
        try:
            return Auction.objects.select_related('highest_bidder').get(pk=self.auction_id)
        except Auction.DoesNotExist:
            return None
