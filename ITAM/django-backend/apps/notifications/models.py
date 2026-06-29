from django.conf import settings
from django.db import models


class NotificationType(models.TextChoices):
    ASSET_ASSIGNED = "asset_assigned", "Asset Assigned"
    ASSET_RETURNED = "asset_returned", "Asset Returned"
    ASSET_RETIRED = "asset_retired", "Asset Retired"
    ASSET_DISPOSED = "asset_disposed", "Asset Disposed"
    MAINTENANCE_CREATED = "maintenance_created", "Maintenance Created"
    MAINTENANCE_COMPLETED = "maintenance_completed", "Maintenance Completed"
    LICENSE_EXPIRY = "license_expiry", "License Nearing Expiry"


class Notification(models.Model):
    notification_type = models.CharField(
        max_length=32,
        choices=NotificationType.choices,
        default=NotificationType.ASSET_ASSIGNED,
    )
    message = models.TextField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="notifications",
        on_delete=models.CASCADE,
    )
    read_status = models.BooleanField(default=False, db_index=True)
    related_asset_id = models.IntegerField(null=True, blank=True)
    related_assignment_id = models.IntegerField(null=True, blank=True)
    related_maintenance_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"To {self.user.email}: {self.message[:40]}"
