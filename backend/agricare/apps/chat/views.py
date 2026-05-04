from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

User = get_user_model()


class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages')

    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start or retrieve a conversation with another user."""
        other_id = request.data.get('user_id')
        if not other_id:
            return Response({'detail': 'user_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            other = User.objects.get(pk=other_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if other == request.user:
            return Response({'detail': 'Cannot chat with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        conv = Conversation.get_or_create_between(request.user, other)
        return Response(
            ConversationSerializer(conv, context={'request': request}).data,
            status=status.HTTP_200_OK
        )


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conv_id = self.kwargs.get('conversation_pk')
        # Mark messages as read
        Message.objects.filter(
            conversation_id=conv_id, is_read=False
        ).exclude(sender=self.request.user).update(is_read=True)
        return Message.objects.filter(conversation_id=conv_id).select_related('sender')

    def perform_create(self, serializer):
        conv_id = self.kwargs.get('conversation_pk')
        try:
            conv = Conversation.objects.get(pk=conv_id, participants=self.request.user)
        except Conversation.DoesNotExist:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Not a participant of this conversation.')
        msg = serializer.save(sender=self.request.user, conversation=conv)
        conv.save()  # update updated_at
        return msg
