from rest_framework.routers import DefaultRouter

from .views import ManufacturerViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"manufacturers", ManufacturerViewSet, basename="manufacturer")
