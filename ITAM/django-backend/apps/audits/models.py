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
    # Department now references a registered Department model
    department = models.ForeignKey(
        "core.Department",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="Limit audit to a specific department (optional)"
    )

    # Audit identifier and type
    audit_id = models.CharField(max_length=32, unique=True, db_index=True, editable=False, null=True, blank=True)

    class AuditType(models.TextChoices):
        INVENTORY = "inventory", "Inventory Audit"
        ASSET_ASSIGNMENT = "asset_assignment", "Asset Assignment Audit"
        LOCATION = "location", "Location Audit"
        CONDITION = "condition", "Condition Audit"
        COMPLIANCE = "compliance", "Compliance Audit"
        FINANCIAL = "financial", "Financial Audit"
        SECURITY = "security", "Security Audit"
        FULL = "full", "Full IT Asset Audit"

    PURPOSES = {
        "inventory": "Verify that physical assets exist and match ITAM records",
        "asset_assignment": "Verify assets are assigned to the correct employee/department",
        "location": "Verify assets are physically located where the system says they are",
        "condition": "Verify asset physical/operational condition",
        "compliance": "Check whether assets meet company policies",
        "financial": "Verify asset cost, depreciation, and financial records",
        "security": "Check security-related asset information",
        "full": "Comprehensive audit covering all of the above",
    }

    audit_type = models.CharField(
        max_length=32,
        choices=AuditType.choices,
        default=AuditType.FULL,
        help_text="Type of audit"
    )

    lead_auditor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="lead_audits",
        on_delete=models.SET_NULL,
        help_text="Primary auditor/owner of this session"
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
        return f"{getattr(self, 'audit_id', '')} — {self.title} ({self.audit_date or self.planned_date})"

    @classmethod
    def get_type_title(cls, audit_type):
        return dict(cls.AuditType.choices).get(audit_type, "Audit Session")

    @classmethod
    def get_audit_type_purpose(cls, audit_type):
        return cls.PURPOSES.get(audit_type, "Audit covering the selected asset scope")

    def save(self, *args, **kwargs):
        """Auto-generate the title and audit_id for standard audit types."""
        self.title = self.get_type_title(self.audit_type) or "Audit Session"

        base_title = self.title.strip()
        if self.pk:
            duplicate_exists = (
                AuditSession.objects.filter(title__iexact=base_title)
                .exclude(pk=self.pk)
                .exists()
            )
        else:
            duplicate_exists = AuditSession.objects.filter(title__iexact=base_title).exists()

        if duplicate_exists:
            seq = 2
            candidate = f"{base_title} {seq}"
            while AuditSession.objects.filter(title__iexact=candidate).exclude(pk=self.pk).exists():
                seq += 1
                candidate = f"{base_title} {seq}"
            self.title = candidate

        if not self.audit_id:
            year = (self.audit_date or self.planned_date or now().date()).year
            prefix = f"AUD-{year}-"
            # Find the highest existing sequence for the year
            last = (
                AuditSession.objects.filter(audit_id__startswith=prefix)
                .order_by("-audit_id")
                .first()
            )
            if last and last.audit_id:
                try:
                    last_seq = int(last.audit_id.rsplit("-", 1)[-1])
                except Exception:
                    last_seq = AuditSession.objects.filter(audit_date__year=year).count()
                seq = last_seq + 1
            else:
                seq = AuditSession.objects.filter(audit_date__year=year).count() + 1

            self.audit_id = f"{prefix}{seq:04d}"

        super().save(*args, **kwargs)
    
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
            ("excellent", "Excellent"),
            ("good", "Good"),
            ("fair", "Fair"),
            ("poor", "Poor"),
            ("damaged", "Damaged"),
            ("missing_parts", "Missing Parts"),
            ("not_functional", "Not Functional"),
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
    # Structured verification checks (tag/serial/location/user match booleans)
    verification = models.JSONField(default=dict, blank=True, help_text="Verification checklist (tag_match, serial_match, assigned_user_correct, location_correct)")
    
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

    @property
    def result_status(self) -> str:
        """Map internal finding status to user-facing audit result types."""
        if self.status == AuditFinding.Status.FOUND:
            return "Verified"
        if self.status == AuditFinding.Status.NOT_FOUND:
            return "Not Found"
        if self.status == AuditFinding.Status.DAMAGED:
            return "Damaged"
        if self.status in (
            AuditFinding.Status.CONDITION_ISSUE,
            AuditFinding.Status.LOCATION_MISMATCH,
            AuditFinding.Status.OWNERSHIP_MISMATCH,
            AuditFinding.Status.OTHER,
        ):
            return "Mismatch"
        return "Not Audited"


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
