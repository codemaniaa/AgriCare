from django.urls import path
from . import views

urlpatterns = [
    path('initiate/',            views.initiate_payment,  name='payment-initiate'),
    path('status/<uuid:txn_id>/',views.transaction_status,name='payment-status'),
    path('retry/<uuid:txn_id>/', views.retry_payment,     name='payment-retry'),
]
