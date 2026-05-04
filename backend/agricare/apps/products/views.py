from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, ProductRating, Wishlist, SUBCATEGORY_MAP
from .serializers import (
    ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer, ProductRatingSerializer
)
from .permissions import IsSellerOrReadOnly

Product.objects.select_related('seller')
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('seller').prefetch_related('images').all()
    permission_classes = [IsAuthenticatedOrReadOnly, IsSellerOrReadOnly]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['category', 'product_type', 'status', 'seller']
    search_fields      = ['title', 'description', 'location', 'subcategory']
    ordering_fields    = ['price', 'created_at', 'rating', 'views_count']
    ordering           = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        # Price range filter
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)

        # Location filter
        location = self.request.query_params.get('location')
        if location:
            qs = qs.filter(location__icontains=location)

        return qs

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        return super().retrieve(request, *args, **kwargs)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_products(self, request):
        qs = Product.objects.filter(seller=request.user).prefetch_related('images')
        serializer = ProductListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        qs = Product.objects.filter(status='available').order_by('-rating', '-views_count')[:8]
        serializer = ProductListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def rate(self, request, pk=None):
        product = self.get_object()
        if product.seller == request.user:
            return Response(
                {'detail': 'You cannot rate your own product.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = ProductRatingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        rating_val = serializer.validated_data['rating']
        obj, created = ProductRating.objects.update_or_create(
            product=product, user=request.user,
            defaults={
                'rating': rating_val,
                'review': serializer.validated_data.get('review', '')
            }
        )
        # Recalculate average
        all_ratings = ProductRating.objects.filter(product=product)
        product.rating       = sum(r.rating for r in all_ratings) / all_ratings.count()
        product.rating_count = all_ratings.count()
        product.save(update_fields=['rating', 'rating_count'])

        return Response(ProductRatingSerializer(obj).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def subcategories(self, request):
        category = request.query_params.get('category', '')
        subs = SUBCATEGORY_MAP.get(category.lower(), [])
        return Response({'subcategories': subs})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_wishlist(self, request, pk=None):
        product = self.get_object()
        obj, created = Wishlist.objects.get_or_create(user=request.user, product=product)
        if not created:
            obj.delete()
            return Response({'wishlisted': False, 'detail': 'Removed from wishlist.'})
        return Response({'wishlisted': True, 'detail': 'Added to wishlist.'}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def wishlist(self, request):
        product_ids = Wishlist.objects.filter(user=request.user).values_list('product_id', flat=True)
        qs = Product.objects.filter(id__in=product_ids).prefetch_related('images')
        serializer = ProductListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)
