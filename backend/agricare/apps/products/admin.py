from django.contrib import admin
from .models import Product, ProductImage, ProductRating, Wishlist


class ProductImageInline(admin.TabularInline):
    model  = ProductImage
    extra  = 0
    fields = ('image', 'is_primary', 'order')


class ProductRatingInline(admin.TabularInline):
    model  = ProductRating
    extra  = 0
    fields = ('user', 'rating', 'review', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display   = ('title', 'seller', 'category', 'price', 'status', 'product_type', 'stock_qty', 'rating', 'created_at')
    list_filter    = ('category', 'status', 'product_type')
    search_fields  = ('title', 'description', 'seller__username', 'location')
    ordering       = ('-created_at',)
    inlines        = [ProductImageInline, ProductRatingInline]
    readonly_fields = ('views_count', 'rating', 'rating_count', 'created_at', 'updated_at')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_primary', 'order')


@admin.register(ProductRating)
class ProductRatingAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    search_fields = ('user__username', 'product__title')

