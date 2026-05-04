from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator
from agricare.apps.products.models import Product
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

AUCTION_STATUS = [
    ('scheduled', 'Scheduled'),
    ('active',    'Active'),
    ('ended',     'Ended'),
    ('cancelled', 'Cancelled'),
]


class Auction(models.Model):
    product           = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='auction')
    seller            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='auctions')
    base_price        = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(1)])
    min_bid_increment = models.DecimalField(max_digits=10, decimal_places=2, default=5)
    current_price     = models.DecimalField(max_digits=12, decimal_places=2)  # updated on each bid
    highest_bidder    = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='winning_auctions'
    )
    auction_start     = models.DateTimeField(default=timezone.now)
    auction_end       = models.DateTimeField()
    status            = models.CharField(max_length=20, choices=AUCTION_STATUS, default='active')
    total_bids        = models.PositiveIntegerField(default=0)
    # Winner / settlement
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    winning_bid = models.FloatField(null=True, blank=True)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auctions'
        ordering = ['-created_at']

    def __str__(self):
        return f'Auction: {self.product.title} ({self.status})'

    def save(self, *args, **kwargs):
        if not self.pk:
            self.current_price = self.base_price
        super().save(*args, **kwargs)

    # ─────────────────────────────────────────────────────────────────
    @property
    def is_active(self):
      now = timezone.now()
      return self.status != 'cancelled' and self.auction_start <= now <= self.auction_end

    @property
    def time_remaining_seconds(self):
        if not self.is_active:
            return 0
        delta = self.auction_end - timezone.now()
        return max(0, int(delta.total_seconds()))

    @property
    def min_next_bid(self):
        return float(self.current_price) + float(self.min_bid_increment)

   

def end_auction(self):

    # Prevent multiple execution (IMPORTANT)
    if self.status == 'ended':
        return

    self.status = 'ended'
    self.product.status = 'sold'
    self.product.save(update_fields=['status'])

    if self.highest_bidder:
        self.winner = self.highest_bidder

        # Auto-create order
        from agricare.apps.orders.models import Order
        order = Order.objects.create(
            buyer=self.winner,
            seller=self.seller,
            product=self.product,
            quantity=self.product.stock_qty or 1,
            total_price=self.current_price,
            payment_type='cod',
            payment_status='unpaid',
            notes='Won via auction.',
        )
        self.winner_order = order

        # Notifications
        from agricare.apps.notifications.models import Notification
        Notification.create(
            recipient=self.winner,
            notif_type='order_placed',
            title=f'🎉 You won the auction for {self.product.title}!',
            body=f'Winning bid: Rs{self.current_price}. Complete your order to confirm.',
            link='/orders',
        )
        Notification.create(
            recipient=self.seller,
            notif_type='product_sold',
            title=f'Auction ended: {self.product.title}',
            body=f'Winner: {self.winner.username} — Rs{self.current_price}',
            link='/orders',
        )

    self.save()

    # 🔥🔥🔥 ADD THIS (REAL-TIME UPDATE)
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'auction_{self.id}',
            {
                'type': 'auction_ended',
                'winner': self.winner.username if self.winner else None,
                'winner_id': self.winner.id if self.winner else None,
                'final_price': float(self.current_price),
            }
        )
    except Exception as e:
        print("WS Error:", e)


class Bid(models.Model):
    auction    = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name='bids')
    bidder     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bids')
    amount     = models.DecimalField(max_digits=12, decimal_places=2)
    is_winning = models.BooleanField(default=True)   # only the top bid is winning
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bids'
        ordering = ['-amount', '-created_at']
        indexes  = [models.Index(fields=['auction', '-amount'])]

    def __str__(self):
        return f'{self.bidder.username} bid Rs{self.amount} on {self.auction.product.title}'

