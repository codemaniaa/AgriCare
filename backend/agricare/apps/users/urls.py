from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/',        views.register_view,       name='register'),
    path('verify-otp/',      views.verify_otp_view,     name='verify-otp'),
    path('resend-otp/',      views.resend_otp_view,     name='resend-otp'),
    path('login/',           views.login_view,           name='login'),
    path('logout/',          views.logout_view,          name='logout'),
    path('token/refresh/',   TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/',         views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.change_password_view, name='change-password'),
    path('forgot-password/', views.forgot_password_view, name='forgot-password'),
    path('reset-password/',  views.reset_password_view,  name='reset-password'),
    path('dashboard/',       views.dashboard_stats_view, name='dashboard-stats'), 
    path('profile/<str:username>/', views.public_profile),
]
