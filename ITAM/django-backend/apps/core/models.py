"""
Core models used across the application.
Provides audit logging and common utilities.
"""

from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class AuditLog(models.Model):
    """
    Comprehensive audit trail for all model changes.
    Tracks who changed what, when, and what changed.
    
    This model uses Django's ContentType framework to create
    a generic audit log that works with any model.
    """
    
    # What changed (using GenericForeignKey)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.PROTECT,
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Who changed it
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='audit_logs',
    )
    
    # What action
    ACTION_CHOICES = [
        ('create', 'Created'),
        ('update', 'Updated'),
        ('delete', 'Deleted'),
        ('status_change', 'Status Changed'),
        ('assignment', 'Assignment Changed'),
    ]
    action = models.CharField(
        max_length=32,
        choices=ACTION_CHOICES,
        db_index=True,
    )
    
    # Details of changes
    changes = models.JSONField(
        default=dict,
        help_text="Dictionary of {field: [old_value, new_value]}"
    )
    reason = models.TextField(blank=True)
    
    # When
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # IP address for extra security
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['content_type', 'object_id', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
    
    def __str__(self) -> str:
        return f"{self.get_action_display()} {self.content_object} by {self.user} at {self.timestamp}"


class AuditLogMixin(models.Model):
    """
    Mixin to add audit logging capability to any model.
    Provides helper methods for logging changes.
    """
    
    class Meta:
        abstract = True
    
    @staticmethod
    def _get_ip_address(request=None):
        """Get IP address from request if available."""
        if not request:
            return None
        
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
    
    @classmethod
    def _log_change(cls, obj, action, user, changes=None, reason='', request=None):
        """
        Log a model change to the audit trail.
        
        Args:
            obj: Model instance being changed
            action: Type of action (create, update, delete, status_change, assignment)
            user: User making the change
            changes: Dict of field changes {field: [old_value, new_value]}
            reason: Reason for the change
            request: HTTP request object (optional)
        """
        AuditLog.objects.create(
            content_type=ContentType.objects.get_for_model(cls),
            object_id=obj.pk,
            user=user,
            action=action,
            changes=changes or {},
            reason=reason,
            ip_address=cls._get_ip_address(request),
        )