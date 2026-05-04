from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display  = ('txn_id','user','gateway','amount','status','attempts','created_at')
    list_filter   = ('gateway','status')
    search_fields = ('txn_id','user__username','gateway_txn_id')
    readonly_fields = ('txn_id','gateway_response','created_at','updated_at')
