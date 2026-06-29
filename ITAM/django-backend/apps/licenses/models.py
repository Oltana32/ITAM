from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Vendor(models.TextChoices):
    """Common software vendors."""
    MICROSOFT = "microsoft", "Microsoft"
    ADOBE = "adobe", "Adobe"
    ORACLE = "oracle", "Oracle"
    SAP = "sap", "SAP"
    AUTODESK = "autodesk", "Autodesk"
    VMWARE = "vmware", "VMware"
    CISCO = "cisco", "Cisco"
    IBM = "ibm", "IBM"
    GOOGLE = "google", "Google"
    ATLASSIAN = "atlassian", "Atlassian"
    RED_HAT = "red_hat", "Red Hat"
    JETBRAINS = "jetbrains", "JetBrains"
    ZOHO = "zoho", "Zoho"
    SALESFORCE = "salesforce", "Salesforce"
    OTHER = "other", "Other"


class SoftwareLicense(models.Model):
    software_name = models.CharField(max_length=255, db_index=True)
    seats = models.PositiveIntegerField(default=1)
    expiry_date = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="software_licenses",
        on_delete=models.SET_NULL,
    )
    vendor = models.CharField(
        max_length=32,
        choices=Vendor.choices,
        default=Vendor.OTHER,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["software_name", "-id"]
        verbose_name = "software license"
        verbose_name_plural = "software licenses"

    def __str__(self) -> str:
        return self.software_name

    @property
    def allocated_seats(self) -> int:
        return self.assignments.filter(revoked_at__isnull=True).count()

    @property
    def available_seats(self) -> int:
        return max(self.seats - self.allocated_seats, 0)

    def clean(self) -> None:
        super().clean()
        if self.seats < 1:
            raise ValidationError({"seats": "License must have at least one seat."})
        if self.pk and self.seats < self.allocated_seats:
            raise ValidationError(
                {"seats": "Seats cannot be lower than active license assignments."}
            )

    def save(self, *args, **kwargs) -> None:
        self.clean()
        super().save(*args, **kwargs)


class LicenseAssignment(models.Model):
    """A single allocated seat from a software license."""

    license = models.ForeignKey(
        SoftwareLicense,
        related_name="assignments",
        on_delete=models.CASCADE,
    )
    assigned_to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="license_assignments",
        on_delete=models.SET_NULL,
    )
    asset = models.ForeignKey(
        "assets.Asset",
        null=True,
        blank=True,
        related_name="license_assignments",
        on_delete=models.SET_NULL,
    )
    assigned_to_name = models.CharField(max_length=255, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-assigned_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["license", "assigned_to_user"],
                condition=Q(revoked_at__isnull=True, assigned_to_user__isnull=False),
                name="uniq_active_license_assignment_per_user",
            ),
            models.UniqueConstraint(
                fields=["license", "asset"],
                condition=Q(revoked_at__isnull=True, asset__isnull=False),
                name="uniq_active_license_assignment_per_asset",
            ),
        ]
        verbose_name = "license assignment"
        verbose_name_plural = "license assignments"

    def __str__(self) -> str:
        recipient = self.assigned_to_user or self.asset or self.assigned_to_name
        return f"{self.license.software_name} -> {recipient}"

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None

    def clean(self) -> None:
        super().clean()
        if not any([self.assigned_to_user_id, self.asset_id, self.assigned_to_name]):
            raise ValidationError(
                "License assignment must target a user, asset, or named recipient."
            )

        if self.is_active:
            active_assignments = LicenseAssignment.objects.filter(
                license=self.license,
                revoked_at__isnull=True,
            )
            if self.pk:
                active_assignments = active_assignments.exclude(pk=self.pk)
            if active_assignments.count() >= self.license.seats:
                raise ValidationError("No available seats remain for this license.")

    def save(self, *args, **kwargs) -> None:
        self.clean()
        super().save(*args, **kwargs)
