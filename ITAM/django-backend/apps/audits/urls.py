# django-backend/apps/audits/urls.py

from rest_framework.routers import DefaultRouter
from .views import AuditSessionViewSet, AuditFindingViewSet


def register_routes(router: DefaultRouter):
    """Register audit routes."""
    router.register(r'audit-sessions', AuditSessionViewSet, basename='audit-session')
    router.register(r'audit-findings', AuditFindingViewSet, basename='audit-finding')
