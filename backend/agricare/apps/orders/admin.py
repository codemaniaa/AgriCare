from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display   = ('id','buyer','seller','product','quantity','total_price',
                       'status','payment_type','created_at')
    list_filter    = ('status','payment_type')
    search_fields  = ('buyer__username','seller__username','product__title')
    ordering       = ('-created_at',)
    readonly_fields = ('total_price','created_at','updated_at')
    fieldsets = (
        ('Order',   {'fields':('buyer','seller','product','quantity','total_price','status','notes')}),
        ('Delivery',{'fields':('delivery_name','delivery_phone','delivery_city','delivery_address')}),
        ('Payment', {'fields':('payment_type',)}),
        ('Meta',    {'fields':('created_at','updated_at')}),
    )
