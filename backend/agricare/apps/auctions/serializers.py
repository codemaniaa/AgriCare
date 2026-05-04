from rest_framework import serializers
from django.utils import timezone
from .models import Auction, Bid


class BidSerializer(serializers.ModelSerializer):
    bidder_name   = serializers.CharField(source='bidder.username', read_only=True)
    bidder_city   = serializers.CharField(source='bidder.city', read_only=True)
    bidder_initial = serializers.SerializerMethodField()

    class Meta:
        model  = Bid
        fields = ['id','bidder_name','bidder_city','bidder_initial','amount','is_winning','created_at']
        read_only_fields = fields

    def get_bidder_initial(self, obj):
        return obj.bidder.username[0].upper() if obj.bidder.username else '?'


class PlaceBidSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def validate_amount(self, value):
        auction = self.context.get('auction')
        if not auction:
            raise serializers.ValidationError('Auction context missing.')
        if not auction.is_active:
            raise serializers.ValidationError('This auction has ended.')
        if float(value) < auction.min_next_bid:
            raise serializers.ValidationError(
                f'Bid must be at least Rs{auction.min_next_bid:.0f} '
                f'(current Rs{auction.current_price} + Rs{auction.min_bid_increment} increment).'
            )
        return value


class AuctionListSerializer(serializers.ModelSerializer):
    product_title    = serializers.CharField(source='product.title', read_only=True)
    product_category = serializers.CharField(source='product.category', read_only=True)
    product_location = serializers.CharField(source='product.location', read_only=True)
    product_image    = serializers.SerializerMethodField()
    seller_name      = serializers.CharField(source='seller.username', read_only=True)
    seller_id        = serializers.IntegerField(source='seller.id', read_only=True)
    time_remaining   = serializers.IntegerField(source='time_remaining_seconds', read_only=True)
    min_next_bid     = serializers.FloatField(read_only=True)

    class Meta:
        model  = Auction
        fields = [
            'id','product','product_title','product_category','product_location',
            'product_image','seller_name','seller_id','base_price','current_price',
            'min_bid_increment','min_next_bid','auction_end','status',
            'total_bids','time_remaining','created_at',
        ]

    def get_product_image(self, obj):
        img = obj.product.images.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class AuctionDetailSerializer(AuctionListSerializer):
    bids             = serializers.SerializerMethodField()
    highest_bidder_name = serializers.CharField(source='highest_bidder.username', read_only=True, default=None)
    product_images   = serializers.SerializerMethodField()
    product_stock    = serializers.IntegerField(source='product.stock_qty', read_only=True)
    product_description = serializers.CharField(source='product.description', read_only=True)
    winner_name= serializers.CharField(source='winner.username', read_only=True, default=None)
    winner_id  = serializers.IntegerField(source='winner.id', read_only=True, default=None)
    class Meta(AuctionListSerializer.Meta):
        fields = AuctionListSerializer.Meta.fields + [
            'bids','highest_bidder_name','product_images',
            'product_stock','product_description','winner',
        ]

    def get_bids(self, obj):
        top_bids = obj.bids.order_by('-amount', '-created_at')[:20]
        return BidSerializer(top_bids, many=True).data

    def get_product_images(self, obj):
        request = self.context.get('request')
        imgs = obj.product.images.all()
        if request:
            return [request.build_absolute_uri(i.image.url) for i in imgs]
        return [i.image.url for i in imgs]


class AuctionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Auction
        fields = ['product','base_price','min_bid_increment','auction_start','auction_end']

    def validate(self, data):
        product = data.get('product')
        if product and product.product_type != 'auction':
            raise serializers.ValidationError('Product must be of type "auction".')
        if product and product.seller != self.context['request'].user:
            raise serializers.ValidationError('You can only create auctions for your own products.')
        end = data.get('auction_end')
        start = data.get('auction_start', timezone.now())
        if end and end <= start:
            raise serializers.ValidationError('Auction end time must be after start time.')
        if hasattr(product, 'auction'):
            raise serializers.ValidationError("Auction already exists for this product.")
        return data
        