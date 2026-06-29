from django.conf import settings
from django.db import models


class ReportType(models.TextChoices):
    ASSET_INVENTORY = "asset_inventory", "Asset inventory"
    ASSIGNMENTS = "assignments", "Assignments"
    LICENSE_EXPIRY = "license_expiry", "License expiry"
    MAINTENANCE_DUE = "maintenance_due", "Maintenance due"
    CUSTOM = "custom", "Custom"


class SavedReport(models.Model):
    """User-saved report definition (filters/parameters for dashboards or exports)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="saved_reports",
        on_delete=models.CASCADE,
    )
    name = models.CharField(max_length=255)
    report_type = models.CharField(max_length=64, choices=ReportType.choices, db_index=True)
    parameters = models.JSONField(default=dict, blank=True)
    is_shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return self.name
