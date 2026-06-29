from rest_framework.routers import DefaultRouter

from .views import SavedReportViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"reports", SavedReportViewSet, basename="report")
