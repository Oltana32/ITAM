"""Notification services for real event-based notifications."""

from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Notification, NotificationType

User = get_user_model()


@transaction.atomic
def notify_asset_assigned(assignment):
    """Create notification when asset is assigned."""
    # Notify the person assigned to
    try:
        # Get all IT staff and admins
        from apps.users.models import UserRole
        
        receivers = User.objects.filter(
            role__in=[UserRole.ADMIN, UserRole.IT_TEAM]
        ).exclude(pk=assignment.assigner_id)
        
        for receiver in receivers:
            Notification.objects.create(
                notification_type=NotificationType.ASSET_ASSIGNED,
                message=f"Asset {assignment.asset.tag} ({assignment.asset.name}) assigned to {assignment.assigned_to_name}",
                user=receiver,
                related_asset_id=assignment.asset.id,
                related_assignment_id=assignment.id,
            )
    except Exception as e:
        print(f"Error notifying asset assignment: {e}")


@transaction.atomic
def notify_asset_returned(assignment):
    """Create notification when asset is returned."""
    try:
        from apps.users.models import UserRole
        
        receivers = User.objects.filter(
            role__in=[UserRole.ADMIN, UserRole.IT_TEAM]
        ).exclude(pk=assignment.assigner_id)
        
        for receiver in receivers:
            Notification.objects.create(
                notification_type=NotificationType.ASSET_RETURNED,
                message=f"Asset {assignment.asset.tag} ({assignment.asset.name}) returned by {assignment.assigned_to_name}",
                user=receiver,
                related_asset_id=assignment.asset.id,
                related_assignment_id=assignment.id,
            )
    except Exception as e:
        print(f"Error notifying asset return: {e}")


@transaction.atomic
def notify_asset_retired(asset):
    """Create notification when asset is retired."""
    try:
        from apps.users.models import UserRole
        
        receivers = User.objects.filter(
            role__in=[UserRole.ADMIN, UserRole.IT_TEAM]
        )
        
        for receiver in receivers:
            Notification.objects.create(
                notification_type=NotificationType.ASSET_RETIRED,
                message=f"Asset {asset.tag} ({asset.name}) has been retired",
                user=receiver,
                related_asset_id=asset.id,
            )
    except Exception as e:
        print(f"Error notifying asset retirement: {e}")


@transaction.atomic
def notify_asset_disposed(asset):
    """Create notification when asset is disposed."""
    try:
        from apps.users.models import UserRole
        
        receivers = User.objects.filter(
            role__in=[UserRole.ADMIN, UserRole.IT_TEAM]
        )
        
        for receiver in receivers:
            Notification.objects.create(
                notification_type=NotificationType.ASSET_DISPOSED,
                message=f"Asset {asset.tag} ({asset.name}) has been disposed",
                user=receiver,
                related_asset_id=asset.id,
            )
    except Exception as e:
        print(f"Error notifying asset disposal: {e}")


@transaction.atomic
def notify_maintenance_created(maintenance):
    """Create notification when maintenance is scheduled."""
    try:
        from apps.users.models import UserRole
        
        receivers = User.objects.filter(
            role__in=[UserRole.ADMIN, UserRole.IT_TEAM]
        )
        
        for receiver in receivers:
            Notification.objects.create(
                notification_type=NotificationType.MAINTENANCE_CREATED,
                message=f"Maintenance scheduled for {maintenance.asset.tag} ({maintenance.asset.name}) on {maintenance.schedule_date}",
                user=receiver,
                related_asset_id=maintenance.asset.id,
                related_maintenance_id=maintenance.id,
            )
    except Exception as e:
        print(f"Error notifying maintenance creation: {e}")


@transaction.atomic
def notify_maintenance_completed(maintenance):
    """Create notification when maintenance is completed."""
    try:
        from apps.users.models import UserRole
        
        receivers = User.objects.filter(
            role__in=[UserRole.ADMIN, UserRole.IT_TEAM]
        )
        
        for receiver in receivers:
            Notification.objects.create(
                notification_type=NotificationType.MAINTENANCE_COMPLETED,
                message=f"Maintenance completed for {maintenance.asset.tag} ({maintenance.asset.name})",
                user=receiver,
                related_asset_id=maintenance.asset.id,
                related_maintenance_id=maintenance.id,
            )
    except Exception as e:
        print(f"Error notifying maintenance completion: {e}")


@transaction.atomic
def notify_license_expiry(license_record):
    """Create notification when license is nearing expiry."""
    try:
        from apps.users.models import UserRole
        
        receivers = User.objects.filter(
            role__in=[UserRole.ADMIN, UserRole.IT_TEAM]
        )
        
        for receiver in receivers:
            Notification.objects.create(
                notification_type=NotificationType.LICENSE_EXPIRY,
                message=f"License for {license_record.software_name} ({license_record.get_vendor_display()}) expires on {license_record.expiry_date}",
                user=receiver,
            )
    except Exception as e:
        print(f"Error notifying license expiry: {e}")
