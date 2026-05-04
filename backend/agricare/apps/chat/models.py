from django.db import models
from django.conf import settings


class Conversation(models.Model):
    participants = models.ManyToManyField(  settings.AUTH_USER_MODEL, related_name='conversations' )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']

    def __str__(self):
        names = ', '.join(u.username for u in self.participants.all())
        return f'Conversation: {names}'

    @classmethod
    def get_or_create_between(cls, user1, user2):
        conv = cls.objects.filter( participants=user1 ).filter( participants=user2 ).first()
        if not conv:
            conv = cls.objects.create()
            conv.participants.add(user1, user2)
        return conv


class Message(models.Model):
    conversation = models.ForeignKey( Conversation, on_delete=models.CASCADE, related_name='messages' )
    sender       = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages'
    )
    content      = models.TextField()
    image        = models.ImageField(upload_to='chat_images/', blank=True, null=True)
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.username}: {self.content[:40]}'
