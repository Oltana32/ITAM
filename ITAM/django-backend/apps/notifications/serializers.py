from rest_framework import serializers

from .models import Notification, NotificationType


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source="get_notification_type_display", read_only=True)

    class Meta:
        model = Notification
        fields = (
            "id",
            "notification_type",
            "notification_type_display",
            "message",
            "user",
            "read_status",
            "related_asset_id",
            "related_assignment_id",
            "related_maintenance_id",
            "created_at",
        )
        read_only_fields = ("id", "message", "user", "created_at")
