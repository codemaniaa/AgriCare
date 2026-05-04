from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer

VALID_TRANSITIONS = {
    'confirmed': ['processing'],
    'processing': ['shipped'],
    'shipped': ['delivered'],
}


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class   = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        buyer_orders  = Order.objects.filter(buyer=user)
        seller_orders = Order.objects.filter(seller=user)
        return (buyer_orders | seller_orders).distinct().select_related(
            'product', 'buyer', 'seller'
        ).prefetch_related('product__images')
    
    def perform_create(self, serializer):
        order = serializer.save(
            buyer=self.request.user,
            status='pending'
        )

    # 👉 IMPORTANT: don't confirm order here
    # wait for payment

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')

        if order.seller != request.user:
            return Response({'detail': 'Not allowed'}, status=403)

        allowed = VALID_TRANSITIONS.get(order.status, [])

        if new_status not in allowed:
            return Response({'detail': 'Invalid transition'}, status=400)

        order.status = new_status
        order.save()

        return Response(OrderSerializer(order, context={'request': request}).data)
    
    @action(detail=False, methods=['get'])
    def as_seller(self, request):
        qs = Order.objects.filter(seller=request.user).select_related(
            'product', 'buyer'
        ).prefetch_related('product__images')
        return Response(OrderSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Dashboard stats for orders."""
        user = request.user
        qs   = Order.objects.filter(seller=user)
        return Response({
            'total':     qs.count(),
            'pending':   qs.filter(status='pending').count(),
            'confirmed': qs.filter(status='confirmed').count(),
            'shipped':   qs.filter(status='shipped').count(),
            'delivered': qs.filter(status='delivered').count(),
            'revenue':   sum(o.total_price for o in qs.filter(status='delivered')),
        })
