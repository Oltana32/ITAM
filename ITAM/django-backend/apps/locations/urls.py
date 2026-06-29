from rest_framework.routers import DefaultRouter

from .views import LocationViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"locations", LocationViewSet, basename="location")
