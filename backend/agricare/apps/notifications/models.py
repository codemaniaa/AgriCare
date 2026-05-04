from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('order_placed',    'Order Placed'),
        ('order_updated',   'Order Status Updated'),
        ('new_message',     'New Message'),
        ('product_sold',    'Product Sold'),
        ('review_received', 'Review Received'),
    ]

    recipient  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notif_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title      = models.CharField(max_length=200)
    body       = models.TextField(blank=True)
    link       = models.CharField(max_length=200, blank=True)  # frontend route
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient.username} — {self.title}'

    @classmethod
    def create(cls, recipient, notif_type, title, body='', link=''):
        return cls.objects.create(
            recipient=recipient,
            notif_type=notif_type,
            title=title,
            body=body,
            link=link,
        )
