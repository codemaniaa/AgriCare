from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


CATEGORY_CHOICES = [
    ('grains',      'Grains'),
    ('fruits',      'Fruits'),
    ('vegetables',  'Vegetables'),
    ('livestock',   'Livestock'),
    ('tools',       'Tools'),
    ('fertilizers', 'Fertilizers'),
]

SUBCATEGORY_MAP = {
    'grains':      ['Wheat', 'Rice', 'Barley', 'Maize', 'Millet'],
    'fruits':      ['Mango', 'Citrus', 'Grapes', 'Apple', 'Banana', 'Guava'],
    'vegetables':  ['Tomato', 'Potato', 'Okra', 'Onion', 'Garlic', 'Chilli'],
    'livestock':   ['Cattle', 'Goats', 'Poultry', 'Sheep', 'Camel'],
    'tools':       ['Tractors', 'Plows', 'Irrigation', 'Sprayers', 'Harvesters'],
    'fertilizers': ['Urea', 'DAP', 'Potash', 'Organic', 'Compost'],
}

TYPE_CHOICES = [
    ('buy_now',     'Buy Now'),
    ('auction',     'Auction'),
    ('negotiable',  'Negotiable'),
]

STATUS_CHOICES = [
    ('available', 'Available'),
    ('sold',      'Sold'),
    ('pending',   'Pending'),
]


class Product(models.Model):
    seller      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products'
    )
    title       = models.CharField(max_length=200)
    description = models.TextField()  # validated in serializer
    price       = models.DecimalField(max_digits=12, decimal_places=2,
                                      validators=[MinValueValidator(0.01)])
    category    = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    subcategory = models.CharField(max_length=50)
    location    = models.CharField(max_length=100)
    product_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='buy_now')
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    stock_qty   = models.PositiveIntegerField(default=0)
    rating      = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    rating_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} — {self.seller.username}'

    @property
    def primary_image(self):
        img = self.images.first()
        return img.image.url if img else None


class ProductImage(models.Model):
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image    = models.ImageField(upload_to='products/')
    is_primary = models.BooleanField(default=False)
    order    = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'product_images'
        ordering = ['order']

    def __str__(self):
        return f'Image for {self.product.title}'


class ProductRating(models.Model):
    product   = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='ratings')
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating    = models.PositiveSmallIntegerField()  # 1-5
    review    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_ratings'
        unique_together = ('product', 'user')


class Wishlist(models.Model):
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    product    = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'wishlists'
        unique_together = ('user', 'product')
        ordering        = ['-created_at']

    def __str__(self):
        return f'{self.user.username} → {self.product.title}'

