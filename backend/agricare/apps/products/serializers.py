from rest_framework import serializers
from .models import Product, ProductImage, ProductRating


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductImage
        fields = ['id', 'image', 'is_primary', 'order']


class ProductRatingSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model  = ProductRating
        fields = ['id', 'user_name', 'rating', 'review', 'created_at']
        read_only_fields = ['id', 'user_name', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing."""
    seller_name  = serializers.CharField(source='seller.username', read_only=True)
    seller_city  = serializers.CharField(source='seller.city', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'title', 'price', 'category', 'subcategory', 'location',
            'product_type', 'status', 'stock_qty', 'rating', 'rating_count',
            'views_count', 'seller_name', 'seller_city', 'primary_image', 'created_at',
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer with images + ratings."""
    images       = ProductImageSerializer(many=True, read_only=True)
    ratings      = ProductRatingSerializer(many=True, read_only=True)
    seller_name  = serializers.CharField(source='seller.username', read_only=True)
    seller_city  = serializers.CharField(source='seller.city', read_only=True)
    seller_id    = serializers.IntegerField(source='seller.id', read_only=True)

    class Meta:
        model  = Product
        fields = [
            'id', 'title', 'description', 'price', 'category', 'subcategory',
            'location', 'product_type', 'status', 'stock_qty', 'rating',
            'rating_count', 'views_count', 'seller_id', 'seller_name', 'seller_city',
            'images', 'ratings', 'created_at', 'updated_at',
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )

    class Meta:
        model  = Product
        fields = [
            'title', 'description', 'price', 'category', 'subcategory',
            'location', 'product_type', 'stock_qty', 'uploaded_images',
        ]

    def validate_description(self, value):
        if len(value.strip()) < 50:
            raise serializers.ValidationError('Description must be at least 50 characters.')
        return value

    def validate_title(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('Title must be at least 5 characters.')
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than 0.')
        return value

    def validate(self, data):
        images = data.get('uploaded_images', [])
        # On create, minimum 4 images required
        if self.instance is None and len(images) < 4:
            raise serializers.ValidationError(
                {'uploaded_images': 'At least 4 product images are required.'}
            )
        return data

    def create(self, validated_data):
        images = validated_data.pop('uploaded_images', [])
        product = Product.objects.create(**validated_data)
        for idx, img in enumerate(images):
            ProductImage.objects.create(
                product=product, image=img,
                is_primary=(idx == 0), order=idx
            )
        return product

    def update(self, instance, validated_data):
        images = validated_data.pop('uploaded_images', [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if images:
            instance.images.all().delete()
            for idx, img in enumerate(images):
                ProductImage.objects.create(
                    product=instance, image=img,
                    is_primary=(idx == 0), order=idx
                )
        return instance
