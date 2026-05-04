from django.urls import path
from apps.auctions.consumers import AuctionConsumer

websocket_urlpatterns = [
    path("ws/auction/<int:auction_id>/", AuctionConsumer.as_asgi()),
]