from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated

from config.permissions import IsITTeamOrAdmin

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsITTeamOrAdmin]
    ordering = ("-created_at",)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related("user")

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        self.get_queryset().filter(read_status=False).update(read_status=True)
        return Response({"detail": "All notifications marked read."})

    @action(detail=False, methods=["post"])
    def clear_all(self, request):
        """Delete all notifications for the current user."""
        count, _ = self.get_queryset().delete()
        return Response({
            "detail": f"Deleted {count} notification(s).",
            "count": count
        })
