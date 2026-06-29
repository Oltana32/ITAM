from rest_framework.routers import DefaultRouter

from .views import NotificationViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"notifications", NotificationViewSet, basename="notification")
