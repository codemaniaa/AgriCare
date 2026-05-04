from django.contrib import admin
from .models import Auction, Bid

class BidInline(admin.TabularInline):
    model = Bid
    extra = 0
    fields = ('bidder','amount','is_winning','created_at')
    readonly_fields = ('created_at',)

@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display  = ('product','seller','base_price','current_price','status','total_bids','auction_end')
    list_filter   = ('status',)
    search_fields = ('product__title','seller__username')
    inlines       = [BidInline]
    actions       = ['end_selected_auctions']

    def end_selected_auctions(self, request, queryset):
        for a in queryset.filter(status='active'):
            a.end_auction()
    end_selected_auctions.short_description = 'End selected auctions now'

@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display  = ('auction','bidder','amount','is_winning','created_at')
    list_filter   = ('is_winning',)
    search_fields = ('bidder__username','auction__product__title')
