"""Aggregate API routes (DRF routers)."""

from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.routers import DefaultRouter

from apps.assets.urls import register_routes as register_assets
from apps.assignments.urls import register_routes as register_assignments
from apps.attachments.urls import register_routes as register_attachments
from apps.audits.urls import register_routes as register_audits
from apps.licenses.urls import register_routes as register_licenses
from apps.locations.urls import register_routes as register_locations
from apps.maintenance.urls import register_routes as register_maintenance
from apps.manufacturers.urls import register_routes as register_manufacturers
from apps.notifications.urls import register_routes as register_notifications
from apps.reports.urls import register_routes as register_reports
from apps.users.urls import register_routes as register_users

router = DefaultRouter()
for register in (
    register_users,
    register_locations,
    register_manufacturers,
    register_assets,
    register_attachments,
    register_audits,
    register_assignments,
    register_maintenance,
    register_licenses,
    register_notifications,
    register_reports,
):
    register(router)

urlpatterns = [
    path("", include(router.urls)),
    # API Schema & Documentation
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/swagger/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("docs/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
