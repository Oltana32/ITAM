"""
Signals for automatic audit logging of model changes.

Django signals allow us to automatically create audit log entries
whenever models are created, updated, or deleted.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from apps.core.models import AuditLog


def create_audit_log(sender, instance, action, user, changes=None, reason='', **kwargs):
    """
    Helper function to create an audit log entry.
    
    Can be called from signal handlers or directly from views.
    
    Args:
        sender: The model class that triggered this
        instance: The model instance that was changed
        action: Type of action (create, update, delete, status_change, assignment)
        user: User who made the change
        changes: Dict of field changes {field: [old_value, new_value]}
        reason: Reason for the change
    """
    if not user:
        return  # Don't log if no user (should always have a user)
    
    AuditLog.objects.create(
        content_type=ContentType.objects.get_for_model(sender),
        object_id=instance.pk,
        user=user,
        action=action,
        changes=changes or {},
        reason=reason,
    )


# Note: Specific signal handlers for Asset and Assignment models
# are defined in their respective apps' signals.py files to keep
# concerns separated and avoid circular imports.