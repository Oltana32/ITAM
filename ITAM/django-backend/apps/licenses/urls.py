from rest_framework.routers import DefaultRouter

from .views import LicenseAssignmentViewSet, LicenseViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"licenses", LicenseViewSet, basename="license")
    router.register(r"license-assignments", LicenseAssignmentViewSet, basename="license-assignment")
