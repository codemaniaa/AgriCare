from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model       = Message
    extra       = 0
    fields      = ('sender', 'content', 'is_read', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('id', 'participant_names', 'updated_at')
    inlines      = [MessageInline]

    def participant_names(self, obj):
        return ', '.join(u.username for u in obj.participants.all())
    participant_names.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ('sender', 'conversation', 'content_preview', 'is_read', 'created_at')
    list_filter   = ('is_read',)
    search_fields = ('sender__username', 'content')
    ordering      = ('-created_at',)

    def content_preview(self, obj):
        return obj.content[:60]
    content_preview.short_description = 'Message'
