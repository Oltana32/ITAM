from rest_framework.routers import DefaultRouter

from .views import UserViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"users", UserViewSet, basename="user")
