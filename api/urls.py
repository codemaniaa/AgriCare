from django.urls import path
from .views import register, login, profile
from . import views
urlpatterns = [

path('register/',register),
path('login/',login),
path('profile/',profile),
path("products/", views.get_products),
path("products/create/", views.create_product),
path("products/update/<int:id>/", views.update_product),
path("products/delete/<int:id>/", views.delete_product),
]