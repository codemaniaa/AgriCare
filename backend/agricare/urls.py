from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('agricare.apps.users.urls')),
    path('api/products/', include('agricare.apps.products.urls')),
    path('api/orders/', include('agricare.apps.orders.urls')),
    path('api/chat/', include('agricare.apps.chat.urls')),
    path('api/notifications/', include('agricare.apps.notifications.urls')),
    path('api/auctions/', include('agricare.apps.auctions.urls')),
    path('api/payments/', include('agricare.apps.payments.urls')),
    path('api/admin/', include('agricare.apps.admin_panel.urls')), 
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
