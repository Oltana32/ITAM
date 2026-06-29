from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.core.constants import AssetStatus


class MaintenanceType(models.TextChoices):
    PREVENTIVE = "preventive", "Preventive"
    CORRECTIVE = "corrective", "Corrective"
    UPGRADE = "upgrade", "Upgrade"
    INSPECTION = "inspection", "Inspection"


class MaintenanceStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Scheduled"
    IN_PROGRESS = "in_progress", "In progress"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class MaintenanceRecord(models.Model):
    asset = models.ForeignKey(
        "assets.Asset",
        related_name="maintenance_records",
        on_delete=models.CASCADE,
    )
    type = models.CharField(max_length=32, choices=MaintenanceType.choices, db_index=True)
    schedule_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=MaintenanceStatus.choices,
        default=MaintenanceStatus.SCHEDULED,
        db_index=True,
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="maintenance_jobs",
        on_delete=models.SET_NULL,
    )
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["schedule_date", "-id"]
        verbose_name = "maintenance record"
        verbose_name_plural = "maintenance records"

    def __str__(self) -> str:
        return f"{self.asset.tag} — {self.get_type_display()} ({self.status})"

    def clean(self) -> None:
        super().clean()
        if self.completed_date and self.schedule_date and self.completed_date < self.schedule_date:
            raise ValidationError(
                {"completed_date": "Completed date cannot be before schedule date."}
            )
        if self.status == MaintenanceStatus.IN_PROGRESS and self.asset.is_in_active_use:
            raise ValidationError(
                {"asset": "Assigned or in-use assets must be returned before maintenance starts."}
            )

    def save(self, *args, **kwargs) -> None:
        previous_status = None
        if self.pk:
            previous_status = (
                MaintenanceRecord.objects.filter(pk=self.pk)
                .values_list("status", flat=True)
                .first()
            )

        if self.status == MaintenanceStatus.COMPLETED and not self.completed_date:
            self.completed_date = timezone.now().date()

        self.full_clean()
        super().save(*args, **kwargs)
        self._sync_asset_status(previous_status)

    def _sync_asset_status(self, previous_status: str | None) -> None:
        if self.status == MaintenanceStatus.IN_PROGRESS and self.asset.status != AssetStatus.MAINTENANCE:
            self.asset.change_status(
                AssetStatus.MAINTENANCE,
                changed_by=self.technician,
                reason=f"Maintenance record #{self.pk} started",
            )
        elif (
            previous_status == MaintenanceStatus.IN_PROGRESS
            and self.status in [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]
            and self.asset.status == AssetStatus.MAINTENANCE
        ):
            self.asset.change_status(
                AssetStatus.AVAILABLE,
                changed_by=self.technician,
                reason=f"Maintenance record #{self.pk} {self.status}",
            )
