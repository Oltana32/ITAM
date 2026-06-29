# django-backend/apps/audits/models.py

"""Asset audit system for physical verification of assets."""

from django.conf import settings
from django.db import models
from django.utils.timezone import now


class AuditSession(models.Model):
    """Represents an audit session."""
    
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
    
    # Session metadata
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNED,
        db_index=True,
    )
    
    # Auditors
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="audits_created",
        on_delete=models.PROTECT,
    )
    auditors = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="audits_assigned",
        help_text="Users assigned as auditors for this session"
    )
    
    # Timing
    planned_date = models.DateField()
    audit_date = models.DateField(null=True, blank=True, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Scope
    location = models.ForeignKey(
        "locations.Location",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="Limit audit to specific location (optional)"
    )
    category = models.CharField(
        max_length=32,
        blank=True,
        help_text="Limit audit to specific asset category (optional)"
    )
    department = models.CharField(
        max_length=255,
        blank=True,
        help_text="Limit audit to a specific department (optional)"
    )
    
    # Summary
    total_assets_audited = models.PositiveIntegerField(default=0)
    assets_found = models.PositiveIntegerField(default=0)
    assets_not_found = models.PositiveIntegerField(default=0)
    assets_with_issues = models.PositiveIntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ["-audit_date", "-planned_date"]
        indexes = [
            models.Index(fields=["status", "-audit_date"]),
            models.Index(fields=["created_by", "-created_at"]),
        ]
        verbose_name = "Audit Session"
        verbose_name_plural = "Audit Sessions"
    
    def __str__(self) -> str:
        return f"{self.title} ({self.audit_date or self.planned_date})"
    
    def calculate_variance(self):
        """Calculate audit variance (missing vs found)."""
        return {
            "total_audited": self.total_assets_audited,
            "found": self.assets_found,
            "not_found": self.assets_not_found,
            "variance_percentage": (
                (self.assets_not_found / self.total_assets_audited * 100)
                if self.total_assets_audited > 0
                else 0
            ),
            "issues": self.assets_with_issues,
        }


class AuditFinding(models.Model):
    """Individual audit findings for assets."""
    
    class Status(models.TextChoices):
        FOUND = "found", "Found"
        NOT_FOUND = "not_found", "Not Found"
        DAMAGED = "damaged", "Damaged"
        CONDITION_ISSUE = "condition_issue", "Condition Issue"
        LOCATION_MISMATCH = "location_mismatch", "Location Mismatch"
        OWNERSHIP_MISMATCH = "ownership_mismatch", "Ownership Mismatch"
        OTHER = "other", "Other"
    
    # Relationship to session and asset
    audit_session = models.ForeignKey(
        AuditSession,
        related_name="findings",
        on_delete=models.CASCADE,
    )
    asset = models.ForeignKey(
        "assets.Asset",
        related_name="audit_findings",
        on_delete=models.CASCADE,
    )
    
    # Finding details
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        db_index=True,
    )
    notes = models.TextField(blank=True, help_text="Detailed notes about the finding")
    
    # Verification
    auditor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="audit_findings",
    )
    verified_at = models.DateTimeField(auto_now_add=True)
    
    # Condition check
    current_condition = models.CharField(
        max_length=20,
        blank=True,
        choices=[
            ("excellent", "Excellent"),
            ("good", "Good"),
            ("fair", "Fair"),
            ("poor", "Poor"),
            ("damaged", "Damaged"),
        ],
        help_text="Condition observed during audit"
    )
    
    # Location check
    current_location = models.ForeignKey(
        "locations.Location",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_location_findings",
        help_text="Actual location found during audit"
    )
    
    # Photos/evidence
    evidence_notes = models.TextField(blank=True, help_text="Evidence or photo descriptions")
    
    class Meta:
        ordering = ["-verified_at"]
        indexes = [
            models.Index(fields=["audit_session", "status"]),
            models.Index(fields=["asset", "-verified_at"]),
        ]
        unique_together = ("audit_session", "asset")
        verbose_name = "Audit Finding"
        verbose_name_plural = "Audit Findings"
    
    def __str__(self) -> str:
        return f"{self.asset.tag} - {self.get_status_display()} ({self.audit_session.title})"


class VarianceReport(models.Model):
    """Summarized variance report for an audit session."""
    
    audit_session = models.OneToOneField(
        AuditSession,
        related_name="variance_report",
        on_delete=models.CASCADE,
    )
    
    # Summary counts
    total_expected = models.PositiveIntegerField()
    total_found = models.PositiveIntegerField()
    total_missing = models.PositiveIntegerField()
    
    # Issue breakdown
    damaged_count = models.PositiveIntegerField(default=0)
    condition_issues_count = models.PositiveIntegerField(default=0)
    location_mismatches_count = models.PositiveIntegerField(default=0)
    ownership_mismatches_count = models.PositiveIntegerField(default=0)
    
    # Metrics
    accuracy_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Percentage of assets correctly located"
    )
    
    # Report details
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="variance_reports",
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, help_text="Additional variance report notes")
    
    class Meta:
        verbose_name = "Variance Report"
        verbose_name_plural = "Variance Reports"
    
    def __str__(self) -> str:
        return f"Variance Report - {self.audit_session.title}"
