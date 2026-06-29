# django-backend/apps/assignments/models.py

from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.core.constants import AssetStatus
from apps.assets.validators import validate_status_transition


class Assignment(models.Model):
    """Track asset assignments to users/employees."""
    
    # Asset being assigned (one-to-many: asset can have multiple assignments over time)
    asset = models.ForeignKey(
        "assets.Asset",
        related_name="assignments",
        on_delete=models.CASCADE,
    )
    
    # Who made the assignment
    assigner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="asset_assignments_made",
        on_delete=models.PROTECT,
    )
    
    # Who the asset is assigned to
    # Use CharField to support both users in system and external employees
    assigned_to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="asset_assignments_received",
        on_delete=models.SET_NULL,
        help_text="System user receiving this asset"
    )
    assigned_to_name = models.CharField(
        max_length=255,
        help_text="Name of person asset is assigned to (if not a system user)"
    )
    
    # Employee/location info
    employee_id = models.CharField(max_length=64)
    department = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=32, blank=True)
    location = models.CharField(max_length=255)
    
    # Timeline
    assigned_date = models.DateTimeField(auto_now_add=True)
    expected_return_date = models.DateField(null=True, blank=True)
    actual_return_date = models.DateField(null=True, blank=True)
    
    # Status - mirrors asset status for quick filtering
    status = models.CharField(
        max_length=32,
        choices=AssetStatus.choices,
        default=AssetStatus.ASSIGNED,
        db_index=True,
        help_text="Current status of this assignment"
    )
    
    # Notes
    notes = models.TextField(blank=True)
    condition_on_return = models.CharField(
        max_length=32,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('fair', 'Fair'),
            ('poor', 'Poor'),
            ('damaged', 'Damaged'),
        ],
        null=True,
        blank=True,
        help_text="Condition of asset when returned"
    )
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="assignments_created",
        on_delete=models.SET_NULL,
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="assignments_updated",
        on_delete=models.SET_NULL,
    )
    
    class Meta:
        ordering = ["-assigned_date", "-id"]
        indexes = [
            models.Index(fields=["status", "assigned_date"]),
            models.Index(fields=["asset", "status"]),
        ]
        # CRITICAL: Only one active assignment per asset at a time
        constraints = [
            models.UniqueConstraint(
                fields=['asset'],
                condition=models.Q(status__in=[
                    AssetStatus.ASSIGNED,
                    AssetStatus.IN_USE,
                ]),
                name='only_one_active_assignment_per_asset'
            ),
        ]
        verbose_name = "Assignment"
        verbose_name_plural = "Assignments"
    
    def __str__(self) -> str:
        return f"{self.asset.tag} → {self.assigned_to_name} ({self.status})"
    
    def clean(self) -> None:
        """Validate assignment."""
        super().clean()
        
        active_statuses = [AssetStatus.ASSIGNED, AssetStatus.IN_USE]

        # Asset must be available when creating or updating an active assignment.
        if self.status in active_statuses and not self.asset.is_available_for_assignment:
            raise ValidationError(
                f"Cannot assign asset in {self.asset.status} status"
            )
        
        if self.status in active_statuses:
            existing = Assignment.objects.filter(
                asset=self.asset,
                status__in=active_statuses
            ).exclude(pk=self.pk)
            
            if existing.exists():
                raise ValidationError(
                    "This asset already has an active assignment"
                )
    
    def save(self, *args, **kwargs) -> None:
        """Override save to run validation."""
        self.clean()
        
        # Update asset status to match assignment
        if (
            self.status in [AssetStatus.ASSIGNED, AssetStatus.IN_USE]
            and self.asset.is_available_for_assignment
        ):
            self.asset.change_status(
                AssetStatus.ASSIGNED,
                changed_by=self.assigner
            )
        
        super().save(*args, **kwargs)
    
    def return_asset(self, condition: str = None, returned_by=None) -> None:
        """
        Mark assignment as returned.
        
        Args:
            condition: Condition of asset on return
            returned_by: User processing the return
        """
        if self.status in [AssetStatus.RETURNED, AssetStatus.RETIRED, AssetStatus.DISPOSED]:
            raise ValidationError("Cannot return an already returned/retired asset")
        
        self.actual_return_date = timezone.now().date()
        self.condition_on_return = condition
        self.status = AssetStatus.RETURNED
        self.updated_by = returned_by
        self.save()
        
        # Update asset status
        self.asset.change_status(AssetStatus.RETURNED, changed_by=returned_by)
