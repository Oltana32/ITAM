from rest_framework.routers import DefaultRouter

from .views import AssetViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"assets", AssetViewSet, basename="asset")
