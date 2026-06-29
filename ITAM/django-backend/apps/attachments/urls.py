# django-backend/apps/attachments/urls.py

from rest_framework.routers import DefaultRouter
from .views import AttachmentViewSet, AttachmentAccessViewSet


def register_routes(router: DefaultRouter):
    """Register attachment routes."""
    router.register(r'attachments', AttachmentViewSet, basename='attachment')
    router.register(r'attachment-access', AttachmentAccessViewSet, basename='attachment-access')
