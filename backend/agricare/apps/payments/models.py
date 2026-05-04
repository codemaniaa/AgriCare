from django.db import models
from django.conf import settings
import uuid
from django.db.models import Q

PAYMENT_GATEWAY = [
    ('jazzcash',      'JazzCash'),
    ('easypaisa',     'Easypaisa'),
    ('bank_transfer', 'Bank Transfer'),
]

TRANSACTION_STATUS = [
    ('initiated', 'Initiated'),
    ('pending',   'Pending Verification'),
    ('success',   'Success'),
    ('failed',    'Failed'),
    ('timeout',   'Timeout'),
    ('refunded',  'Refunded'),
]



class Meta:
    constraints = [
        models.UniqueConstraint(
            fields=['order'],
            condition=Q(status='success'),
            name='one_success_payment_per_order'
        )
    ]
class Transaction(models.Model):
    """Records every payment attempt."""
    txn_id          = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    order           = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='transactions')
    user            = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    gateway         = models.CharField(max_length=20, choices=PAYMENT_GATEWAY)
    amount          = models.DecimalField(max_digits=12, decimal_places=2)
    # Payer info (masked after success)
    account_number  = models.CharField(max_length=30, blank=True)   # mobile/account
    account_name    = models.CharField(max_length=150, blank=True)
    # Gateway response
    gateway_txn_id  = models.CharField(max_length=100, blank=True)
    gateway_response= models.JSONField(default=dict, blank=True)
    status          = models.CharField(max_length=20, choices=TRANSACTION_STATUS, default='initiated')
    failure_reason  = models.TextField(blank=True)
    attempts        = models.PositiveSmallIntegerField(default=1)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f'TXN {self.txn_id} | {self.gateway} | {self.status}'
