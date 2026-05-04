from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers as nested_routers
from .views import ConversationViewSet, MessageViewSet

router = DefaultRouter()
router.register('conversations', ConversationViewSet, basename='conversation')

conv_router = nested_routers.NestedDefaultRouter(router, 'conversations', lookup='conversation')
conv_router.register('messages', MessageViewSet, basename='conversation-messages')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(conv_router.urls)),
]
