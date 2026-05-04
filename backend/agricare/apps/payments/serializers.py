from rest_framework import serializers
from .models import Transaction


class InitiatePaymentSerializer(serializers.Serializer):
    order_id       = serializers.IntegerField()
    gateway        = serializers.ChoiceField(choices=['jazzcash','easypaisa','bank_transfer'])
    account_number = serializers.CharField(max_length=30)
    account_name   = serializers.CharField(max_length=150)


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Transaction
        fields = [
            'txn_id','gateway','amount','account_name',
            'gateway_txn_id','status','failure_reason',
            'attempts','created_at','updated_at',
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # mask account number
        if instance.account_number:
            data['account_number'] = "****" + instance.account_number[-4:]

        return data

def to_representation(self, instance):
    data = super().to_representation(instance)

    # mask account number
    if instance.account_number:
        data['account_number'] = "****" + instance.account_number[-4:]

    return data