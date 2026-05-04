from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Auction, Bid
from .serializers import ( AuctionListSerializer, AuctionDetailSerializer,  AuctionCreateSerializer, BidSerializer, PlaceBidSerializer)


def _broadcast_bid(auction_id: int, bid_data: dict):
    """Push new bid to all WebSocket listeners on this auction."""
    try:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'auction_{auction_id}',
            {'type': 'bid_update', **bid_data}
        )
    except Exception:
        pass  # Non-critical — polling will still work


class AuctionViewSet(viewsets.ModelViewSet):
    queryset = Auction.objects.select_related(
        'product', 'seller', 'highest_bidder'
    ).prefetch_related('product__images').all()

    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['status', 'product__category']
    search_fields      = ['product__title', 'product__location', 'seller__username']
    ordering_fields    = ['current_price', 'auction_end', 'total_bids']
    ordering           = ['auction_end']
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return AuctionCreateSerializer
        if self.action == 'retrieve':
            return AuctionDetailSerializer
        return AuctionListSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)
        

    def get_queryset(self):
        qs = super().get_queryset()

        # Auto-end expired auctions
        expired = qs.filter(status='active', auction_end__lte=timezone.now())
        for a in expired:
            try:
                a.end_auction()
            except:
                pass

        status_param = self.request.query_params.get('status')

        if status_param == 'active':
            return qs.filter(status='active', auction_end__gt=timezone.now())

        elif status_param == 'ended':
            return qs.filter(status='ended')

        elif status_param == 'scheduled':
            return qs.filter(status='scheduled', auction_start__gt=timezone.now())

        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        if instance.status == 'active' and instance.auction_end <= timezone.now():
            instance.end_auction()
            data['min_next_bid'] = instance.min_next_bid
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Live auctions — used on homepage slider."""
        qs = Auction.objects.filter(
            status='active', auction_end__gt=timezone.now()
        ).select_related('product','seller').prefetch_related('product__images').order_by('auction_end')[:10]
        return Response(AuctionListSerializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def place_bid(self, request, pk=None):
        """
        Place a bid. Uses SELECT FOR UPDATE to prevent race conditions.
        """
        try:
            with transaction.atomic():
                # Lock the auction row
                auction = Auction.objects.select_for_update().get(pk=pk)

                # Ownership check
                if auction.seller == request.user:
                    return Response(
                        {'detail': 'You cannot bid on your own auction.'},
                        status=status.HTTP_403_FORBIDDEN
                    )

                # Active check
                if not auction.is_active:
                    return Response(
                        {'detail': 'This auction has ended or is not active.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Validate amount
                serializer = PlaceBidSerializer(
                    data=request.data, context={'auction': auction}
                )
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                amount = serializer.validated_data['amount']

                # Mark previous winning bid as outbid
                Bid.objects.filter(auction=auction, is_winning=True).update(is_winning=False)

                # Create new bid
                bid = Bid.objects.create(
                    auction=auction, bidder=request.user,
                    amount=amount, is_winning=True
                )

                # Update auction
                auction.current_price  = amount
                auction.highest_bidder = request.user
                auction.total_bids     = F('total_bids') + 1
                auction.save(update_fields=['current_price','highest_bidder','total_bids','updated_at'])
                auction.refresh_from_db()

        except Auction.DoesNotExist:
            return Response({'detail': 'Auction not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Broadcast to WebSocket room
        bid_payload = {
            'bid_id':        bid.pk,
            'bidder':        request.user.username,
            'amount':        float(amount),
            'current_price': float(auction.current_price),
            'total_bids':    auction.total_bids,
            'timestamp':     bid.created_at.isoformat(),
        }
        _broadcast_bid(auction.pk, bid_payload)

        return Response({
            **bid_payload,
            'min_next_bid':  auction.min_next_bid,
            'message':       f'Bid of Rs{amount} placed successfully!',
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def bids(self, request, pk=None):
        """Paginated bid history for an auction."""
        auction = self.get_object()
        bids = Bid.objects.filter(auction=auction).select_related('bidder').order_by('-created_at')[:50]
        return Response(BidSerializer(bids, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def end_now(self, request, pk=None):
        """Seller can manually end their own auction early."""
        auction = self.get_object()
        if auction.seller != request.user:
            return Response({'detail': 'Only the seller can end this auction.'}, status=status.HTTP_403_FORBIDDEN)
        if auction.status != 'active':
            return Response({'detail': 'Auction is not active.'}, status=status.HTTP_400_BAD_REQUEST)
        auction.end_auction()
        return Response({'detail': 'Auction ended.', 'winner': auction.winner.username if auction.winner else None})

    def end_auction(self):
        if self.status == 'ended':
            return  # جلوگیری duplicate execution

        self.status = 'ended'