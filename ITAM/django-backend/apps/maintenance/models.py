from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from apps.core.constants import AssetStatus
from apps.notifications.services import notify_maintenance_created, notify_maintenance_completed


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
    previous_assignee_name = models.CharField(max_length=255, blank=True, default="")
    previous_assignee_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="maintenance_previous_assignments",
        on_delete=models.SET_NULL,
    )
    description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
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
        if self.cost is None:
            raise ValidationError({"cost": "Cost is required."})
        if self.completed_date and self.schedule_date and self.completed_date < self.schedule_date:
            raise ValidationError(
                {"completed_date": "Completed date cannot be before schedule date."}
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
        created = previous_status is None
        self._sync_maintenance_assignment(previous_status)
        self._sync_asset_status(previous_status)
        if created and self.status in {MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS}:
            notify_maintenance_created(self)
        elif previous_status != MaintenanceStatus.COMPLETED and self.status == MaintenanceStatus.COMPLETED:
            notify_maintenance_completed(self)

    def _sync_maintenance_assignment(self, previous_status: str | None) -> None:
        if self.status == MaintenanceStatus.IN_PROGRESS and self.technician:
            assignment = self.asset.assignments.filter(status__in=[AssetStatus.ASSIGNED, AssetStatus.IN_USE]).order_by("-assigned_date").first()
            if assignment:
                if not self.previous_assignee_name:
                    self.previous_assignee_name = assignment.assigned_to_name
                if not self.previous_assignee_user and assignment.assigned_to_user:
                    self.previous_assignee_user = assignment.assigned_to_user
                MaintenanceRecord.objects.filter(pk=self.pk).update(
                    previous_assignee_name=self.previous_assignee_name,
                    previous_assignee_user=self.previous_assignee_user,
                )

        elif (
            previous_status == MaintenanceStatus.IN_PROGRESS
            and self.status in [MaintenanceStatus.COMPLETED, MaintenanceStatus.CANCELLED]
        ):
            assignment = self.asset.assignments.filter(status__in=[AssetStatus.ASSIGNED, AssetStatus.IN_USE]).order_by("-assigned_date").first()
            if assignment and (self.previous_assignee_name or self.previous_assignee_user):
                technician_name = self.technician.get_full_name() or self.technician.email if self.technician else None
                previous_user = self.previous_assignee_user
                previous_name = self.previous_assignee_name or (
                    previous_user.get_full_name() or previous_user.email if previous_user else assignment.assigned_to_name
                )

                if assignment.assigned_to_user == self.technician or assignment.assigned_to_name == technician_name:
                    restored_user = previous_user
                    restored_name = previous_name
                    assignment.assigned_to_user = restored_user
                    assignment.assigned_to_name = restored_name
                    assignment.updated_by = self.technician
                    self.asset.assignments.filter(pk=assignment.pk).update(
                        assigned_to_user=restored_user,
                        assigned_to_name=restored_name,
                        updated_by=self.technician,
                        updated_at=timezone.now(),
                    )

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
            next_status = AssetStatus.ASSIGNED if self.asset.assignments.filter(status=AssetStatus.ASSIGNED).exists() else AssetStatus.AVAILABLE
            self.asset.change_status(
                next_status,
                changed_by=self.technician,
                reason=f"Maintenance record #{self.pk} {self.status}",
            )
