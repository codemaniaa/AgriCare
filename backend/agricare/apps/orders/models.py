from django.db import models
from django.conf import settings
from agricare.apps.products.models import Product


ORDER_STATUS = [
    ('pending', 'Pending'),
    ('awaiting_payment', 'Awaiting Payment'),  
    ('confirmed', 'Confirmed'),
    ('processing', 'Processing'),               
    ('shipped', 'Shipped'),
    ('delivered', 'Delivered'),
    ('cancelled', 'Cancelled'),
]

PAYMENT_TYPE = [
    ('cod',           'Cash on Delivery'),
    ('jazzcash',      'JazzCash'),
    ('easypaisa',     'Easypaisa'),
    ('bank_transfer', 'Bank Transfer'),
]

PAYMENT_STATUS = [
    ('unpaid',   'Unpaid'),
    ('pending',  'Payment Pending'),
    ('paid',     'Paid'),
    ('failed',   'Failed'),
    ('refunded', 'Refunded'),
]


class Order(models.Model):
    buyer            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='purchases')
    seller           = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sales')
    product          = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='orders')
    quantity         = models.PositiveIntegerField(default=1)
    total_price      = models.DecimalField(max_digits=12, decimal_places=2)
    status           = models.CharField(max_length=20, choices=ORDER_STATUS, default='pending')
    # Delivery info
    delivery_name    = models.CharField(max_length=150, blank=True)
    delivery_phone   = models.CharField(max_length=20, blank=True)
    delivery_city    = models.CharField(max_length=100, blank=True)
    delivery_address = models.TextField(blank=True)
    # Payment
    payment_type     = models.CharField(max_length=20, choices=PAYMENT_TYPE, default='cod') 
    notes            = models.TextField(blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'
        ordering = ['-created_at']

    def __str__(self):
        return f'Order #{self.pk} — {self.buyer.username} → {self.product.title}'

    def save(self, *args, **kwargs):
        if not self.pk:
            self.total_price = self.product.price * self.quantity
            self.seller = self.product.seller
            if self.payment_type == 'cod':
                self.payment_status = 'unpaid'
        super().save(*args, **kwargs)
