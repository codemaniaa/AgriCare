"""
agricare/apps/admin_panel/views.py

All admin dashboard API views.
These are ADDITIVE — they do NOT touch your existing views.

How to use:
  - Mount these under /api/admin/ in your root urls.py
  - All views require IsAdminDashboardUser permission
"""

from django.contrib.auth import get_user_model

from django.db.models.functions import TruncDay, TruncMonth
from django.db.models import (
    Count, Sum, Q, Avg,
    DecimalField,F
)
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import timedelta

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from agricare.apps.products.models import Product
from agricare.apps.orders.models import Order
from agricare.apps.auctions.models import Auction
from .permissions import IsAdminDashboardUser
from .serializers import (
    DashboardStatsSerializer,
    AdminUserSerializer,
    AdminProductSerializer,
    AdminProductApproveSerializer,
    AdminOrderSerializer,
    AdminOrderStatusSerializer,
    AdminAuctionSerializer,
    AdminAuctionCreateSerializer,
    AdminBidSerializer,
)

User = get_user_model()


# ── Helpers ───────────────────────────────────────────────────────

def _get_model(app_label, model_name):
    """Safely import a model by app label and name."""
    from django.apps import apps
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        return None


class AdminPagination(PageNumberPagination):
    page_size            = 15
    page_size_query_param = 'page_size'
    max_page_size        = 100


# ─────────────────────────────────────────────────────────────────
# DASHBOARD STATS
# ─────────────────────────────────────────────────────────────────

class AdminDashboardStatsView(APIView):
    """
    GET /api/admin/stats/

    Returns all counters and chart data for the dashboard home page.
    """
    permission_classes = [IsAdminDashboardUser]

    def get(self, request):
        today = timezone.now().date()
        thirty_days_ago = timezone.now() - timedelta(days=30)

        Product = _get_model('products', 'Product')
        Order   = _get_model('orders',   'Order')
        Auction = _get_model('auctions', 'Auction')

        # ── Users ──
        total_users   = User.objects.count()
        total_sellers = User.objects.filter(role='farmer').count()
        total_buyers  = User.objects.filter(role='buyer').count()
        new_today     = User.objects.filter(date_joined__date=today).count()

        # ── Products ──
        total_products   = Product.objects.count() if Product else 0
        pending_products = 0
        if Product:
            pending_products = Product.objects.filter(status='pending').count()
        # ── Orders ──
        total_orders  = Order.objects.count() if Order else 0
        revenue_total = 0
        if Order:
            rev = Order.objects.filter(
                status__in=['delivered', 'completed']
            ).aggregate(
                total=Coalesce(Sum('total_price'), 0, output_field=DecimalField())
            )
            revenue_total = rev['total']

        # ── Auctions ──
        total_auctions  = Auction.objects.count() if Auction else 0
        active_auctions = Auction.objects.filter(status='active').count() if Auction else 0

        # ── Chart: Orders per day (last 30 days) ──
        orders_by_day = []
        if Order:
            orders_by_day = list(
                Order.objects.filter(created_at__gte=thirty_days_ago)
                .annotate(day=TruncDay('created_at'))
                .values('day')
                .annotate(count=Count('id'), revenue=Coalesce(Sum('total_price'), 0, output_field=DecimalField()))
                .order_by('day')
                .values('day', 'count', 'revenue')
            )
            for item in orders_by_day:
                item['day'] = item['day'].strftime('%Y-%m-%d')

        # ── Chart: New users per month (last 6 months) ──
        six_months_ago = timezone.now() - timedelta(days=180)
        users_by_month = list(
            User.objects.filter(date_joined__gte=six_months_ago)
            .annotate(month=TruncMonth('date_joined'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        for item in users_by_month:
            item['month'] = item['month'].strftime('%Y-%m')

        data = {
            'total_users':     total_users,
            'total_sellers':   total_sellers,
            'total_buyers':    total_buyers,
            'total_products':  total_products,
            'total_orders':    total_orders,
            'total_auctions':  total_auctions,
            'active_auctions': active_auctions,
            'pending_products': pending_products,
            'revenue_total':   revenue_total,
            'new_users_today': new_today,
            'orders_by_day':   orders_by_day,
            'users_by_month':  users_by_month,
        }
        return Response(data)


# ─────────────────────────────────────────────────────────────────
# USER MANAGEMENT
# ─────────────────────────────────────────────────────────────────

class AdminUserListView(ListAPIView):
    """
    GET /api/admin/users/
    ?search=name&role=seller&is_active=true&ordering=-date_joined
    """
    permission_classes   = [IsAdminDashboardUser]
    serializer_class     = AdminUserSerializer
    pagination_class     = AdminPagination
    filter_backends      = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields        = ['email', 'username', 'first_name', 'last_name']
    ordering_fields      = ['date_joined', 'last_login', 'email']
    ordering             = ['-date_joined']
    filterset_fields     = ['role', 'is_active']

    def get_queryset(self):
        qs = User.objects.exclude(is_superuser=True)
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        banned = self.request.query_params.get('is_banned')
        if banned is not None:
            qs = qs.filter(is_banned=(banned.lower() == 'true'))
        return qs


class AdminUserDetailView(APIView):
    """
    GET    /api/admin/users/<pk>/
    PATCH  /api/admin/users/<pk>/   — update role, is_active
    DELETE /api/admin/users/<pk>/   — hard delete user
    """
    permission_classes = [IsAdminDashboardUser]

    def get_user(self, pk):
        return get_object_or_404(User, pk=pk)

    def get(self, request, pk):
        user = self.get_user(pk)
        return Response(AdminUserSerializer(user).data)

    def patch(self, request, pk):
        user = self.get_user(pk)
        allowed = {'role', 'is_active', 'is_staff'}
        for key in allowed:
            if key in request.data:
                setattr(user, key, request.data[key])
        user.save()
        return Response(AdminUserSerializer(user).data)

    def delete(self, request, pk):
        user = self.get_user(pk)
        if user == request.user:
            return Response({'error': 'Cannot delete yourself.'}, status=400)
        user.delete()
        return Response({'message': 'User deleted.'}, status=200)


class AdminUserBanView(APIView):
    """
    POST /api/admin/users/<pk>/ban/
    Body: { "action": "ban" | "unban" }
    """
    permission_classes = [IsAdminDashboardUser]

    def post(self, request, pk):
        user   = get_object_or_404(User, pk=pk)
        action = request.data.get('action', 'ban')

        if action == 'ban':
            user.is_active = False
            # Set is_banned if your User model has it, else just deactivate
            if hasattr(user, 'is_banned'):
                user.is_banned = True
            user.save()
            return Response({'message': f'User {user.username} has been banned.'})
        elif action == 'unban':
            user.is_active = True
            if hasattr(user, 'is_banned'):
                user.is_banned = False
            user.save()
            return Response({'message': f'User {user.username} has been unbanned.'})
        return Response({'error': 'Invalid action. Use "ban" or "unban".'}, status=400)


# ─────────────────────────────────────────────────────────────────
# PRODUCT MANAGEMENT
# ─────────────────────────────────────────────────────────────────

class AdminProductListView(APIView):
    """
    GET /api/admin/products/
    ?search=wheat&status=pending&category=grains&min_price=100&max_price=5000
    """
    permission_classes = [IsAdminDashboardUser]

    def get(self, request):
        Product = _get_model('products', 'Product')
        if not Product:
            return Response({'error': 'Product model not found.'}, status=404)

        qs = (
            Product.objects
            .select_related('seller')
            .prefetch_related('images')
            .annotate(
                seller_name=F('seller__username'),
                category_name=F('category'),
                price_from=F('price'),
            )
        )

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(seller__username__icontains=search)
            )

        status_f = request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)

        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)

        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request)

        serializer = AdminProductSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

class AdminProductDetailView(APIView):
    """
    GET    /api/admin/products/<pk>/
    DELETE /api/admin/products/<pk>/
    """
    permission_classes = [IsAdminDashboardUser]

    def _get_product(self, pk):
        Product = _get_model('products', 'Product')
        return get_object_or_404(Product, pk=pk)

    def get(self, request, pk):
        p = self._get_product(pk)
        return Response(AdminProductSerializer(p, context={'request': request}).data)

    def delete(self, request, pk):
        p = self._get_product(pk)
        p.delete()
        return Response({'message': 'Product deleted.'})

 

# ─────────────────────────────────────────────────────────────────
# ORDER MANAGEMENT
# ─────────────────────────────────────────────────────────────────
 
class AdminOrderListView(APIView):
    """
    GET /api/admin/orders/
    """
    permission_classes = [IsAdminDashboardUser]

    def get(self, request):
        Order = _get_model('orders', 'Order')
        if not Order:
            return Response({'error': 'Order model not found.'}, status=404)

        # ✅ FIXED QUERY
        qs = Order.objects.select_related('buyer', 'product').order_by('-created_at')

        # 🔍 Filters
        username = request.query_params.get('username')
        if username:
            qs = qs.filter(
                Q(buyer__username__icontains=username) |
                Q(buyer__first_name__icontains=username) |
                Q(buyer__last_name__icontains=username)
            )

        product_q = request.query_params.get('product')
        if product_q:
            qs = qs.filter(product__title__icontains=product_q)

        status_f = request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)

        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')

        price_field = 'total_price' if hasattr(Order, 'total_price') else 'amount'

        if min_price:
            qs = qs.filter(**{f'{price_field}__gte': min_price})

        if max_price:
            qs = qs.filter(**{f'{price_field}__lte': max_price})

        # 📄 Pagination
        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request)

        serializer = AdminOrderSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

class AdminOrderDetailView(APIView):
    """
    GET    /api/admin/orders/<pk>/
    PATCH  /api/admin/orders/<pk>/   — update status
    DELETE /api/admin/orders/<pk>/
    """
    permission_classes = [IsAdminDashboardUser]

    def _get_order(self, pk):
        Order = _get_model('orders', 'Order')
        return get_object_or_404(Order, pk=pk)

    def get(self, request, pk):
        return Response(AdminOrderSerializer(self._get_order(pk)).data)

    def patch(self, request, pk):
        order      = self._get_order(pk)
        serializer = AdminOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = serializer.validated_data['status']
        order.save()
        return Response(AdminOrderSerializer(order).data)

    def delete(self, request, pk):
        self._get_order(pk).delete()
        return Response({'message': 'Order deleted.'})

 
# ─────────────────────────────────────────────────────────────────
# AUCTION MANAGEMENT
# ─────────────────────────────────────────────────────────────────
class AdminAuctionListView(APIView):
    permission_classes = [IsAdminDashboardUser]

    def get(self, request):
        AuctionModel = _get_model('auctions', 'Auction')
        if not AuctionModel:
            return Response({'error': 'Auction model not found.'}, status=404)

        qs = AuctionModel.objects.select_related('product', 'seller', 'highest_bidder').all()

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(product__title__icontains=search)

        status_f = request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)

        qs = qs.annotate(total_bids_count=Count('bids'))

        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request)

        serializer = AdminAuctionSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

class AdminAuctionCreateView(APIView):
    permission_classes = [IsAdminDashboardUser]

    def post(self, request):
        serializer = AdminAuctionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        product = Product.objects.get(id=data['product_id'])

        auction = Auction.objects.create(
            product=product,
            seller=product.seller,
            base_price=data['base_price'],
            current_price=data['base_price'],
            auction_start=data['auction_start'],
            auction_end=data['auction_end'],
            min_bid_increment=data.get('min_bid_increment', 5),
            status='scheduled',
        )

        return Response(AdminAuctionSerializer(auction).data, status=201)
    
class AdminAuctionDetailView(APIView):
    """
    GET    /api/admin/auctions/<pk>/
    DELETE /api/admin/auctions/<pk>/
    """
    permission_classes = [IsAdminDashboardUser]

    def _get_auction(self, pk):
        Auction = _get_model('auctions', 'Auction')
        return get_object_or_404(Auction, pk=pk)

    def get(self, request, pk):
        auction = self._get_auction(pk)
        return Response(AdminAuctionSerializer(auction).data)

    def delete(self, request, pk):
        auction = self._get_auction(pk)
        if auction.status == 'active':
            return Response({'error': 'Cannot delete an active auction. Stop it first.'}, status=400)
        auction.delete()
        return Response({'message': 'Auction deleted.'})


class AdminAuctionToggleView(APIView):
    """
    POST /api/admin/auctions/<pk>/toggle/
    Body: { "action": "start" | "stop" }
    """
    permission_classes = [IsAdminDashboardUser]

    def post(self, request, pk):
        Auction = _get_model('auctions', 'Auction')
        auction = get_object_or_404(Auction, pk=pk)
        action  = request.data.get('action')

        if action == 'start':
            if auction.status not in ('scheduled', 'paused'):
                return Response({'error': f'Cannot start auction with status: {auction.status}'}, status=400)
            auction.status     = 'active'
            auction.start_time = timezone.now()
            auction.save()
            return Response({'message': 'Auction started.', 'status': auction.status})

        elif action == 'stop':
            if auction.status != 'active':
                return Response({'error': 'Auction is not active.'}, status=400)
            auction.status   = 'ended'
            auction.end_time = timezone.now()
            auction.save()
            return Response({'message': 'Auction stopped.', 'status': auction.status})

        return Response({'error': 'Invalid action. Use "start" or "stop".'}, status=400)


class AdminAuctionBidsView(APIView):
    """
    GET /api/admin/auctions/<pk>/bids/
    Full bid history for an auction.
    """
    permission_classes = [IsAdminDashboardUser]

    def get(self, request, pk):
        Auction = _get_model('auctions', 'Auction')
        Bid     = _get_model('auctions', 'Bid')
        if not Bid:
            return Response({'error': 'Bid model not found.'}, status=404)

        auction = get_object_or_404(Auction, pk=pk)
        bids    = Bid.objects.filter(auction=auction)('bidder').order_by('-created_at')

        paginator = AdminPagination()
        page = paginator.paginate_queryset(bids, request)
        serializer = AdminBidSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)



 

class AdminActivityView(APIView):
    def get(self, request):
        activities = []

        # Recent users
        recent_users = User.objects.order_by('-date_joined')[:5]
        for u in recent_users:
            activities.append({
                "icon": "👤",
                "text": f"{u.username} registered",
                "time": u.date_joined,
                "type": "user"
            })

        # Recent orders
        recent_orders = Order.objects.order_by('-created_at')[:5]
        for o in recent_orders:
            activities.append({
                "icon": "🧾",
                "text": f"Order #{o.id} placed",
                "time": o.created_at,
                "type": "order"
            })

        # Recent auctions
        recent_auctions = Auction.objects.order_by('-created_at')[:5]
        for a in recent_auctions:
            activities.append({
                "icon": "🔨",
                "text": f"Auction '{a.title}' created",
                "time": a.created_at,
                "type": "auction"
            })

        # Sort latest first
        activities = sorted(activities, key=lambda x: x["time"], reverse=True)[:10]

        return Response(activities)