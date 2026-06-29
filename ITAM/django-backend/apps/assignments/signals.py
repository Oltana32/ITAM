# django-backend/apps/assignments/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from apps.core.constants import AssetStatus
from apps.core.models import AuditLog


@receiver(post_save, sender='assignments.Assignment')  # Use string reference to avoid circular imports
def audit_assignment_change(sender, instance, created, **kwargs):
    """Log assignment changes to audit trail."""
    
    if not hasattr(instance, '_audit_user'):
        return
    
    action = 'create' if created else 'update'
    user = getattr(instance, '_audit_user', None)
    changes = getattr(instance, '_audit_changes', {})
    
    try:
        AuditLog.objects.create(
            content_type=ContentType.objects.get_for_model(sender),
            object_id=instance.pk,
            user=user,
            action=action,
            changes=changes,
        )
    except Exception as e:
        # Log error but don't break the signal
        print(f"Error creating audit log: {e}")