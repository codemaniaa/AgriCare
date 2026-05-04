from rest_framework import serializers
from .models import Conversation, Message
from agricare.apps.users.serializers import UserProfileSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender_name   = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = ['id', 'conversation', 'sender_name', 'sender_avatar',
                  'content', 'image', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender_name', 'sender_avatar', 'is_read', 'created_at']

    def get_sender_avatar(self, obj):
        if obj.sender.profile_picture:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.sender.profile_picture.url) if request else None
        return None


class ConversationSerializer(serializers.ModelSerializer):
    other_user   = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = ['id', 'other_user', 'last_message', 'unread_count', 'updated_at']

    def get_other_user(self, obj):
        request = self.context.get('request')
        other   = obj.participants.exclude(id=request.user.id).first()
        if other:
            return {'id': other.id, 'username': other.username, 'full_name': other.full_name}
        return None

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'content': msg.content, 'created_at': msg.created_at,
                    'sender': msg.sender.username}
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
