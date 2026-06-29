from rest_framework.routers import DefaultRouter

from .views import MaintenanceViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"maintenance", MaintenanceViewSet, basename="maintenance")
