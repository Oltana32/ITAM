# django-backend/apps/assets/models.py

from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from apps.core.constants import AssetStatus
from apps.assets.validators import validate_status_transition
from apps.assets.tag_generator import generate_asset_tag


class AssetCategory(models.TextChoices):
    LAPTOP = "laptop", "Laptop"
    DESKTOP = "desktop", "Desktop"
    MONITOR = "monitor", "Monitor"
    SERVER = "server", "Server"
    PHONE = "phone", "Phone"
    TABLET = "tablet", "Tablet"
    NETWORK = "network", "Network"
    EQUIPMENT = "equipment", "Equipment"
    OTHER = "other", "Other"


class AssetCondition(models.TextChoices):
    EXCELLENT = "excellent", "Excellent"
    GOOD = "good", "Good"
    FAIR = "fair", "Fair"
    POOR = "poor", "Poor"


class Asset(models.Model):
    """Core IT asset record."""
    
    # Identity
    name = models.CharField(max_length=255)
    tag = models.CharField(max_length=64, unique=True, db_index=True)
    serial_number = models.CharField(max_length=128, unique=True, db_index=True)
    
    # Status (SINGLE SOURCE OF TRUTH - no assignment data here)
    status = models.CharField(
        max_length=32,
        choices=AssetStatus.choices,
        default=AssetStatus.AVAILABLE,
        db_index=True,
    )
    
    # Physical properties
    category = models.CharField(max_length=32, choices=AssetCategory.choices, db_index=True)
    condition = models.CharField(
        max_length=32,
        choices=AssetCondition.choices,
        default=AssetCondition.GOOD,
    )
    model = models.CharField(max_length=255, blank=True)
    
    # Relationships
    manufacturer = models.ForeignKey(
        "manufacturers.Manufacturer",
        related_name="assets",
        on_delete=models.PROTECT,
    )
    location = models.ForeignKey(
        "locations.Location",
        related_name="assets",
        on_delete=models.PROTECT,
    )
    
    # Financial tracking
    purchase_date = models.DateField(null=True, blank=True)
    purchase_cost = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Original purchase cost in company currency"
    )
    warranty_expiry = models.DateField(null=True, blank=True)
    
    # Depreciation tracking
    useful_life_years = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Expected useful life in years"
    )
    residual_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated residual value after depreciation"
    )
    depreciation_method = models.CharField(
        max_length=20,
        choices=[
            ("straight_line", "Straight Line"),
            ("declining", "Declining Balance"),
            ("units", "Units of Production"),
        ],
        default="straight_line",
        help_text="Depreciation calculation method"
    )
    
    # Dynamic specifications based on category
    specs = models.JSONField(
        default=dict,
        blank=True,
        help_text="Category-specific specifications (CPU, RAM, etc.)"
    )
    
    # Organization
    department = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    last_audit_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="assets_created",
        on_delete=models.SET_NULL,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        related_name="assets_updated",
        on_delete=models.SET_NULL,
    )
    
    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["status", "category"]),
            models.Index(fields=["status", "location"]),
        ]
        verbose_name = "Asset"
        verbose_name_plural = "Assets"
    
    def __str__(self) -> str:
        return f"{self.tag} — {self.name}"
    
    def clean(self) -> None:
        """Validate model before saving."""
        super().clean()
        
        # Don't validate status change on initial creation
        if self.pk:
            current = Asset.objects.get(pk=self.pk)
            if current.status != self.status:
                validate_status_transition(current.status, self.status)
    
    def save(self, *args, **kwargs) -> None:
        """Override save to run validation and auto-generate tag."""
        # Auto-generate tag if not provided (only on creation)
        if not self.tag:
            if not self.pk:  # Only on creation
                self.tag = generate_asset_tag(self.category)
            else:
                raise ValidationError("Asset tag cannot be empty for existing assets.")
        
        self.clean()
        super().save(*args, **kwargs)
    
    def change_status(self, new_status: str, changed_by=None, reason: str = "") -> None:
        """
        Change asset status with validation and history tracking.
        
        Args:
            new_status: New status value
            changed_by: User making the change
        
        Raises:
            ValidationError: If transition not allowed
        """
        validate_status_transition(self.status, new_status)
        old_status = self.status
        self.status = new_status
        self.updated_by = changed_by
        self.save()
        
        from apps.assets.history import log_status_change

        log_status_change(
            self,
            old_status,
            new_status,
            changed_by=changed_by,
            reason=reason,
        )
    
    @property
    def is_available_for_assignment(self) -> bool:
        """Check if asset can be assigned."""
        from apps.core.constants import AVAILABLE_STATUSES
        return self.status in AVAILABLE_STATUSES
    
    @property
    def is_in_active_use(self) -> bool:
        """Check if asset is actively assigned to someone."""
        from apps.core.constants import ACTIVE_STATUSES
        return self.status in ACTIVE_STATUSES
    
    @property
    def current_assignment(self):
        """Get the current active assignment, if any."""
        from apps.assignments.models import Assignment
        return self.assignments.filter(status=AssetStatus.ASSIGNED).first()
    
    def calculate_depreciation(self):
        """Calculate current asset value and depreciation.
        
        Returns:
            dict with calculated values or None if insufficient data
        """
        from datetime import date
        from decimal import Decimal
        
        if not self.purchase_cost or not self.purchase_date or not self.useful_life_years:
            return None
        
        # Calculate months in use
        today = date.today()
        months_in_use = (today.year - self.purchase_date.year) * 12 + (today.month - self.purchase_date.month)
        months_useful_life = self.useful_life_years * 12
        
        if months_useful_life <= 0:
            return None
        
        # Depreciation calculations
        residual = self.residual_value or Decimal('0')
        depreciable_amount = self.purchase_cost - residual
        
        if self.depreciation_method == "straight_line":
            # Straight-line: constant depreciation each month
            monthly_depreciation = depreciable_amount / months_useful_life
            total_depreciation = monthly_depreciation * min(months_in_use, months_useful_life)
        elif self.depreciation_method == "declining":
            # Declining balance: 2x straight-line rate applied to book value
            rate = (Decimal('2') / Decimal(months_useful_life)) / Decimal('12')
            book_value = self.purchase_cost
            total_depreciation = Decimal('0')
            
            for _ in range(min(months_in_use, months_useful_life)):
                monthly_depr = book_value * rate
                total_depreciation += monthly_depr
                book_value -= monthly_depr
        else:
            # Units of production - requires usage data
            total_depreciation = Decimal('0')
        
        current_value = max(self.purchase_cost - total_depreciation, residual)
        remaining_months = max(0, months_useful_life - months_in_use)
        
        return {
            "purchase_cost": float(self.purchase_cost),
            "depreciated_value": float(total_depreciation),
            "current_value": float(current_value),
            "residual_value": float(residual),
            "months_in_use": months_in_use,
            "months_useful_life": months_useful_life,
            "remaining_months": remaining_months,
            "depreciation_percentage": float(
                (total_depreciation / self.purchase_cost * 100) 
                if self.purchase_cost > 0 else 0
            ),
            "is_fully_depreciated": current_value <= residual,
        }


class AssetChangeType(models.TextChoices):
    STATUS = "status", "Status Change"
    FIELD = "field", "Field Update"
    CREATE = "create", "Created"
    LOCATION = "location", "Location Change"


class AssetStatusHistory(models.Model):
    """Audit trail for asset changes (status and field updates)."""

    asset = models.ForeignKey(
        Asset,
        related_name="status_history",
        on_delete=models.CASCADE,
    )
    change_type = models.CharField(
        max_length=20,
        choices=AssetChangeType.choices,
        default=AssetChangeType.STATUS,
        db_index=True,
    )
    field_name = models.CharField(max_length=64, blank=True, db_index=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    from_status = models.CharField(max_length=32, choices=AssetStatus.choices, blank=True)
    to_status = models.CharField(max_length=32, choices=AssetStatus.choices, blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="asset_changes_made",
    )
    changed_at = models.DateTimeField(auto_now_add=True, db_index=True)
    reason = models.TextField(blank=True, help_text="Reason for change")

    class Meta:
        ordering = ["-changed_at"]
        verbose_name = "Asset Status History"
        verbose_name_plural = "Asset Status Histories"

    def __str__(self) -> str:
        if self.change_type == AssetChangeType.STATUS:
            return f"{self.asset.tag}: {self.from_status} → {self.to_status}"
        if self.field_name:
            return f"{self.asset.tag}: {self.field_name} changed"
        return f"{self.asset.tag}: {self.get_change_type_display()}"
