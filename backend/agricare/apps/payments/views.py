"""
Payment gateway integration — production-ready structure.

For real deployments:
  JazzCash  → https://sandbox.jazzcash.com.pk/ApplicationAPI/API/
  Easypaisa → https://easypay.easypaisa.com.pk/easypay/
  Bank      → Manual verification via admin

Current mode: SANDBOX (mock responses).
Set PAYMENT_SANDBOX=False in .env to switch to live.
"""
import uuid
import hmac
import hashlib
import random
import string
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Transaction
from .serializers import TransactionSerializer, InitiatePaymentSerializer
from agricare.apps.orders.models import Order
from agricare.apps.notifications.models import Notification
from django.db import transaction as db_transaction

SANDBOX = getattr(settings, 'PAYMENT_SANDBOX', True)


# ── Mock gateway response ──────────────────────────────
def _mock_gateway_response(gateway: str, amount: float, account: str) -> dict:
    """Simulates a successful payment for sandbox mode."""
    return {
        'gateway':       gateway,
        'txn_id':        ''.join(random.choices(string.digits, k=12)),
        'status':        'SUCCESS',
        'amount':        str(amount),
        'account':       account[-4:].rjust(len(account), '*'),
        'timestamp':     timezone.now().isoformat(),
        'response_code': '000',
        'message':       'Transaction Successful',
    }


def _jazzcash_request(amount, mobile, order_id) -> dict:
    """
    JazzCash MPIN Payment API.
    Docs: https://sandbox.jazzcash.com.pk/ApplicationAPI/API/DoMWalletTransaction
    """
    if SANDBOX:
        return _mock_gateway_response('jazzcash', amount, mobile)

    merchant_id  = settings.JAZZCASH_MERCHANT_ID
    password     = settings.JAZZCASH_PASSWORD
    integrity_salt = settings.JAZZCASH_INTEGRITY_SALT
    txn_ref_no   = f'T{timezone.now().strftime("%Y%m%d%H%M%S")}{order_id}'
    txn_amount   = str(int(amount * 100)).zfill(10)  # in paisas
    txn_date_time = timezone.now().strftime('%Y%m%d%H%M%S')
    expiry       = (timezone.now() + timezone.timedelta(hours=1)).strftime('%Y%m%d%H%M%S')

    # Build HMAC-SHA256 hash
    hash_string = '&'.join([
        integrity_salt, txn_date_time, expiry, merchant_id,
        txn_ref_no, mobile, txn_amount, 'PKR', 'MWALLET',
    ])
    secure_hash = hmac.new(
        integrity_salt.encode(), hash_string.encode(), hashlib.sha256
    ).hexdigest().upper()

    payload = {
        'pp_Version': '1.1',
        'pp_TxnType': 'MWALLET',
        'pp_Language': 'EN',
        'pp_MerchantID': merchant_id,
        'pp_Password': password,
        'pp_MobileNumber': mobile,
        'pp_TxnRefNo': txn_ref_no,
        'pp_Amount': txn_amount,
        'pp_TxnCurrency': 'PKR',
        'pp_TxnDateTime': txn_date_time,
        'pp_BillReference': f'order_{order_id}',
        'pp_Description': f'AgriCare Order #{order_id}',
        'pp_TxnExpiryDateTime': expiry,
        'pp_SecureHash': secure_hash,
    }
    import requests
    resp = requests.post(
        'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/DoMWalletTransaction',
        json=payload, timeout=30
    )
    return resp.json()


def _easypaisa_request(amount, mobile, order_id) -> dict:
    """
    Easypaisa Payment API.
    Docs: https://easypay.easypaisa.com.pk
    """
    if SANDBOX:
        return _mock_gateway_response('easypaisa', amount, mobile)

    import requests, base64
    store_id   = settings.EASYPAISA_STORE_ID
    account_no = settings.EASYPAISA_ACCOUNT_NO
    hash_key   = settings.EASYPAISA_HASH_KEY

    payload = {
        'orderId':         f'AC{order_id}',
        'storeId':         store_id,
        'transactionAmount': f'{amount:.2f}',
        'transactionType': 'MA',
        'mobileAccountNo': mobile,
        'emailAddress':    '',
    }
    auth = base64.b64encode(f'{store_id}:{hash_key}'.encode()).decode()
    resp = requests.post(
        'https://easypay.easypaisa.com.pk/easypay/Index.jsf',
        json=payload,
        headers={'Storeid': store_id, 'Authorization': f'Basic {auth}'},
        timeout=30
    )
    return resp.json()


# ── API Views ──────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    serializer = InitiatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data     = serializer.validated_data
    order_id = data['order_id']
    gateway  = data['gateway']
    account  = data['account_number']
    name     = data['account_name']

    try:
        order = Order.objects.get(pk=order_id, buyer=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=404)

    # ✅ Prevent double payment
    if order.transactions.filter(status='success').exists():
        return Response({'detail': 'Order already paid'}, status=400)

    # ✅ Create transaction
    txn = Transaction.objects.create(
        order=order,
        user=request.user,
        gateway=gateway,
        amount=order.total_price,
        account_number=account,
        account_name=name,
        status='initiated',
        attempts=order.transactions.count() + 1
    )

    # ✅ Move order to awaiting payment
    order.status = 'awaiting_payment'
    order.payment_type = gateway
    order.save()

    try:
        # ── Gateway Call ──
        if gateway == 'jazzcash':
            resp = _jazzcash_request(float(order.total_price), account, order.pk)
        elif gateway == 'easypaisa':
            resp = _easypaisa_request(float(order.total_price), account, order.pk)
        else:
            resp = {'status': 'PENDING', 'message': 'Bank transfer under review.'}

        txn.gateway_response = resp
        gateway_status = str(resp.get('status', '')).lower()

        # ── Handle Response ──
        if gateway == 'bank_transfer':
            txn.status = 'pending'

        elif gateway_status in ('success', '000'):
            txn.status = 'success'
            txn.gateway_txn_id = resp.get('txn_id', '')

            # ✅ ONLY HERE confirm order
            order.status = 'confirmed'

            Notification.create(
                recipient=order.seller,
                notif_type='order_placed',
                title=f'Payment received: Order #{order.pk}',
                body=f'{gateway.upper()} payment of Rs{order.total_price} received.',
                link='/orders',
            )

        else:
            txn.status = 'failed'
            txn.failure_reason = resp.get('message', 'Payment failed')

        txn.save()
        order.save()

    except Exception as e:
        txn.status = 'timeout'
        txn.failure_reason = str(e)
        txn.save()

        return Response({
            'detail': 'Gateway timeout. Please try again.',
            'txn_id': str(txn.txn_id),
            'status': 'timeout',
        }, status=504)

    return Response({
        'txn_id': str(txn.txn_id),
        'status': txn.status,
        'order_status': order.status,
        'message': txn.gateway_response.get('message', ''),
        'gateway': gateway,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_status(request, txn_id):
    """Poll transaction status."""
    try:
        txn = Transaction.objects.get(txn_id=txn_id, user=request.user)
    except Transaction.DoesNotExist:
        return Response({'detail': 'Transaction not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(TransactionSerializer(txn).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_transaction(request):
    txn_id = request.data.get('txn_id')
    action = request.data.get('action')  # approve / reject

    try:
        txn = Transaction.objects.get(txn_id=txn_id, order__seller=request.user)
    except Transaction.DoesNotExist:
        return Response({'detail': 'Transaction not found'}, status=404)

    if txn.status == 'success':
        return Response({'detail': 'Already approved'})

    if action == 'approve':
        txn.status = 'success'
        txn.save()

        order = txn.order
        order.status = 'confirmed'
        order.save()

    else:
        txn.status = 'failed'
        txn.failure_reason = 'Rejected by admin'
        txn.save()

    return Response({'message': 'Transaction updated'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_payment(request, txn_id):
    try:
        txn = Transaction.objects.get(txn_id=txn_id, user=request.user)
    except Transaction.DoesNotExist:
        return Response({'detail': 'Transaction not found'}, status=404)

    if txn.status == 'success':
        return Response({'detail': 'Already successful'})

    if txn.attempts >= 3:
        return Response({'detail': 'Max attempts reached'}, status=429)

    # ✅ Create NEW transaction
    new_txn = Transaction.objects.create(
        order=txn.order,
        user=request.user,
        gateway=txn.gateway,
        amount=txn.amount,
        account_number=txn.account_number,
        account_name=txn.account_name,
        attempts=txn.attempts + 1,
        status='initiated'
    )

    return Response({
        'txn_id': str(new_txn.txn_id),
        'status': new_txn.status
    })
