# django-backend/apps/attachments/models.py

"""File attachment system for assets and other entities."""

from django.conf import settings
from django.db import models
from django.core.files.storage import default_storage
from django.utils.timezone import now


class AttachmentType(models.TextChoices):
    """Types of attachments supported."""
    INVOICE = "invoice", "Invoice"
    PURCHASE_ORDER = "purchase_order", "Purchase Order"
    WARRANTY_DOCUMENT = "warranty_document", "Warranty Document"
    MAINTENANCE_REPORT = "maintenance_report", "Maintenance Report"
    VENDOR_CONTRACT = "vendor_contract", "Vendor Contract"
    RECEIPT = "receipt", "Receipt"
    WARRANTY_CERTIFICATE = "warranty_certificate", "Warranty Certificate"
    SPECIFICATION = "specification", "Specification"
    OTHER = "other", "Other"


class Attachment(models.Model):
    """File attachment associated with assets."""
    
    # Relationships
    asset = models.ForeignKey(
        "assets.Asset",
        related_name="attachments",
        on_delete=models.CASCADE,
    )
    
    # File information
    file = models.FileField(
        upload_to="assets/attachments/%Y/%m/%d/",
        help_text="Document file"
    )
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(
        max_length=20,
        choices=AttachmentType.choices,
        default=AttachmentType.OTHER,
        db_index=True,
    )
    file_size = models.BigIntegerField(help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Metadata
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="attachments_uploaded",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Versioning
    version = models.PositiveIntegerField(default=1)
    is_current = models.BooleanField(default=True)
    replaces = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replaced_by",
    )
    
    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["asset", "file_type"]),
            models.Index(fields=["asset", "is_current"]),
            models.Index(fields=["uploaded_at"]),
        ]
        verbose_name = "Attachment"
        verbose_name_plural = "Attachments"
    
    def __str__(self) -> str:
        return f"{self.asset.tag} - {self.file_name}"
    
    def save(self, *args, **kwargs) -> None:
        """Override save to set file metadata."""
        if self.file:
            self.file_size = self.file.size
            if not self.file_name:
                self.file_name = self.file.name
            # Set MIME type if not already set
            if not self.mime_type:
                import mimetypes
                mime_type, _ = mimetypes.guess_type(self.file_name)
                self.mime_type = mime_type or "application/octet-stream"
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs) -> None:
        """Override delete to remove file from storage."""
        if self.file:
            if default_storage.exists(self.file.name):
                default_storage.delete(self.file.name)
        super().delete(*args, **kwargs)


class AttachmentAccess(models.Model):
    """Access control for attachments (audit trail)."""
    
    attachment = models.ForeignKey(
        Attachment,
        related_name="access_logs",
        on_delete=models.CASCADE,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    action = models.CharField(
        max_length=20,
        choices=[
            ("view", "View"),
            ("download", "Download"),
            ("delete", "Delete"),
            ("upload", "Upload"),
        ]
    )
    accessed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-accessed_at"]
        indexes = [
            models.Index(fields=["attachment", "accessed_at"]),
            models.Index(fields=["user", "accessed_at"]),
        ]
    
    def __str__(self) -> str:
        return f"{self.attachment.file_name} - {self.action} by {self.user.email if self.user else 'Unknown'} at {self.accessed_at}"
