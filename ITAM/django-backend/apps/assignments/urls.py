from rest_framework.routers import DefaultRouter

from .views import AssignmentViewSet


def register_routes(router: DefaultRouter) -> None:
    router.register(r"assignments", AssignmentViewSet, basename="assignment")
