from rest_framework import serializers
from .models import Order, PAYMENT_TYPE


class OrderSerializer(serializers.ModelSerializer):
    buyer_name      = serializers.CharField(source='buyer.username',  read_only=True)
    seller_name     = serializers.CharField(source='seller.username', read_only=True)
    product_title   = serializers.CharField(source='product.title',   read_only=True)
    product_image   = serializers.SerializerMethodField()
    payment_type_display  = serializers.CharField(source='get_payment_type_display',  read_only=True) 

    class Meta:
        model  = Order
        fields = [
            'id', 'product', 'product_title', 'product_image',
            'buyer_name', 'seller_name', 'quantity', 'total_price',
            'status', 'notes',
            'delivery_name', 'delivery_phone', 'delivery_city', 'delivery_address',
            'payment_type', 'payment_type_display',
            'created_at',
        ]
        read_only_fields = [
            'id', 'total_price', 'seller_name', 'buyer_name',
            'product_title', 'product_image', 'created_at',
            'payment_type_display'
        ]

    def get_product_image(self, obj):
        img = obj.product.images.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None

    def validate(self, data):
        product = data.get('product')
        qty     = data.get('quantity', 1)
        if product and product.stock_qty < qty:
            raise serializers.ValidationError('Not enough stock available.')
        if product and product.status == 'sold':
            raise serializers.ValidationError('This product is no longer available.')
        return data

    def create(self, validated_data):
        order   = Order.objects.create(**validated_data)
        product = order.product
        product.stock_qty -= order.quantity
        if product.stock_qty == 0:
            product.status = 'sold'
        product.save(update_fields=['stock_qty', 'status'])

        # Notify seller
        try:
            from agricare.apps.notifications.models import Notification
            payment_label = dict(PAYMENT_TYPE).get(order.payment_type, order.payment_type)
            Notification.create(
                recipient  = order.seller,
                notif_type = 'order_placed',
                title      = f'New order: {product.title}',
                body       = f'{order.buyer.full_name} ordered {order.quantity}kg via {payment_label} — Rs{order.total_price}',
                link       = '/orders',
            )
        except Exception:
            pass

        return order
