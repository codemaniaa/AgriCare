"""
agricare/apps/admin_panel/serializers.py

Serializers for Admin Dashboard — Users, Products, Orders, Auctions.
These extend (not replace) your existing serializers.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from agricare.apps.auctions.models import Auction
from agricare.apps.products.models import Product

User = get_user_model()


# ── User Management ───────────────────────────────────────────────
class AdminUserSerializer(serializers.ModelSerializer):
    """Full user info for admin user management table."""
    full_name    = serializers.SerializerMethodField()
    products_count = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'full_name',
            'role', 'is_active', 'is_staff', 'is_superuser', 
            'date_joined', 'last_login',
            'products_count',
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login', 'products_count']

    def get_full_name(self, obj):
     return getattr(obj, 'full_name', None) or obj.username

    def get_products_count(self, obj):
        # Works if user has a related_name 'products' on Product model
        if hasattr(obj, 'products'):
            return obj.products.count()
        return 0



 
class AdminUserBanSerializer(serializers.ModelSerializer):
    """Minimal serializer for ban/unban action."""
    class Meta:
        model  = User
        fields = ['id', 'is_active', 'is_banned']


# ── Product Management ────────────────────────────────────────────

class AdminProductSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField()
    seller_name = serializers.CharField(read_only=True)
    category_name = serializers.CharField(read_only=True)
    price_from = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    status = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        request = self.context.get('request')

        # from annotated / model property
        img = getattr(obj, 'primary_image', None)

        if img and request:
            try:
                return request.build_absolute_uri(img)
            except Exception:
                return img

        return img
 
class AdminProductApproveSerializer(serializers.Serializer):
    """Approve or reject a product."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)


# ── Order Management ──────────────────────────────────────────────

class AdminOrderSerializer(serializers.Serializer):
    """
    Generic order serializer. Adjust to match your Order model fields.
    """
    id           = serializers.IntegerField(read_only=True)
    order_number = serializers.CharField(read_only=True)
    buyer_name   = serializers.SerializerMethodField()
    buyer_id     = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_id   = serializers.SerializerMethodField()
    total_price  = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    amount       = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    status       = serializers.CharField()
    created_at   = serializers.DateTimeField(read_only=True)
    updated_at   = serializers.DateTimeField(read_only=True)

    def get_buyer_name(self, obj):
        return getattr(obj.buyer, 'full_name', None) or obj.buyer.username

    def get_seller_name(self, obj):
        return getattr(obj.seller, 'full_name', None) or obj.seller.username

    

    def get_buyer_id(self, obj):
        buyer = getattr(obj, 'buyer', None) or getattr(obj, 'user', None)
        return buyer.id if buyer else None

    def get_product_name(self, obj):
        product = getattr(obj, 'product', None)
        return getattr(product, 'title', getattr(product, 'name', '—')) if product else '—'

    def get_product_id(self, obj):
        product = getattr(obj, 'product', None)
        return product.id if product else None


class AdminOrderStatusSerializer(serializers.Serializer):
    STATUS_CHOICES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
    status = serializers.ChoiceField(choices=STATUS_CHOICES)


# ── Auction Management ────────────────────────────────────────────
 
class AdminAuctionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.title', read_only=True)
    starting_price = serializers.DecimalField(source='base_price', max_digits=12, decimal_places=2, read_only=True)
    end_time = serializers.DateTimeField(source='auction_end', read_only=True)
    total_bids = serializers.IntegerField(read_only=True)
    highest_bidder = serializers.SerializerMethodField()

    class Meta:
        model = Auction
        fields = [
            'id',
            'product_name',
            'starting_price',
            'current_price',
            'total_bids',
            'end_time',
            'status',
            'created_at',
            'highest_bidder',
        ]

    def get_highest_bidder(self, obj):
        if obj.highest_bidder:
            name = getattr(obj.highest_bidder, 'full_name', None) or obj.highest_bidder.username
            return {'name': name}
        return None

 
class AdminAuctionCreateSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    base_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    auction_start = serializers.DateTimeField()
    auction_end = serializers.DateTimeField()
    min_bid_increment = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=5)

    def validate(self, data):
        if data['auction_end'] <= data['auction_start']:
            raise serializers.ValidationError('auction_end must be after auction_start.')

        product = Product.objects.filter(id=data['product_id']).first()
        if not product:
            raise serializers.ValidationError({'product_id': 'Product not found.'})

        if hasattr(product, 'auction'):
            raise serializers.ValidationError({'product_id': 'This product already has an auction.'})

        return data

class AdminBidSerializer(serializers.Serializer):
    id         = serializers.IntegerField(read_only=True)
    bidder     = serializers.SerializerMethodField()
    amount     = serializers.DecimalField(max_digits=12, decimal_places=2)
    created_at = serializers.DateTimeField(read_only=True)

    def get_bidder(self, obj):
        bidder = getattr(obj, 'bidder', None) or getattr(obj, 'user', None)
        if bidder:
            return {'id': bidder.id, 'name': bidder.username}
        return None


# ── Dashboard Stats ───────────────────────────────────────────────

class DashboardStatsSerializer(serializers.Serializer):
    total_users    = serializers.IntegerField()
    total_sellers  = serializers.IntegerField()
    total_buyers   = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_orders   = serializers.IntegerField()
    total_auctions = serializers.IntegerField()
    active_auctions = serializers.IntegerField()
    pending_products = serializers.IntegerField()
    revenue_total   = serializers.DecimalField(max_digits=14, decimal_places=2)
    new_users_today = serializers.IntegerField()

    # Chart data
    orders_by_day   = serializers.ListField(child=serializers.DictField())
    users_by_month  = serializers.ListField(child=serializers.DictField())
