"""
agricare/apps/admin_panel/urls.py

Mount in your root urls.py:
    path('api/admin/', include('agricare.apps.admin_panel.urls')),
"""

from django.urls import path
from .views import (
    AdminDashboardStatsView,
    # Users
    AdminUserListView,
    AdminUserDetailView,
    AdminUserBanView,
    # Products
    AdminProductListView,
    AdminProductDetailView, 
    # Orders
    AdminOrderListView,
    AdminOrderDetailView,
    # Auctions
    AdminAuctionListView,
    AdminAuctionCreateView,
    AdminAuctionDetailView,
    AdminAuctionToggleView,
    AdminAuctionBidsView,
    AdminActivityView,
)

urlpatterns = [
    # Dashboard stats
    path('stats/',                              AdminDashboardStatsView.as_view(),   name='admin_stats'),

    # Users
    path('users/',                              AdminUserListView.as_view(),         name='admin_users'),
    path('users/<int:pk>/',                     AdminUserDetailView.as_view(),       name='admin_user_detail'),
    path('users/<int:pk>/ban/',                 AdminUserBanView.as_view(),          name='admin_user_ban'),

    # Products
    path('products/',                           AdminProductListView.as_view(),      name='admin_products'),
    path('products/<int:pk>/',                  AdminProductDetailView.as_view(),    name='admin_product_detail'),
    

    # Orders
    path('orders/',                             AdminOrderListView.as_view(),        name='admin_orders'),
    path('orders/<int:pk>/',                    AdminOrderDetailView.as_view(),      name='admin_order_detail'),

    # Auctions
    path('auctions/',                           AdminAuctionListView.as_view(),      name='admin_auctions'),
    path('auctions/create/',                    AdminAuctionCreateView.as_view(),    name='admin_auction_create'),
    path('auctions/<int:pk>/',                  AdminAuctionDetailView.as_view(),    name='admin_auction_detail'),
    path('auctions/<int:pk>/toggle/',           AdminAuctionToggleView.as_view(),    name='admin_auction_toggle'),
    path('auctions/<int:pk>/bids/',             AdminAuctionBidsView.as_view(),      name='admin_auction_bids'),
  
    path('admin/auctions/', AdminAuctionListView.as_view()),
    path('admin/auctions/create/', AdminAuctionCreateView.as_view()),
    path('admin/activity/', AdminActivityView.as_view()),
]
