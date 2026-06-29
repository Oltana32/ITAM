# django-backend/apps/assets/validators.py

from django.core.exceptions import ValidationError
from apps.core.constants import AssetStatus, VALID_STATUS_TRANSITIONS


def validate_status_transition(current_status: str, new_status: str) -> None:
    """
    Validate that status transition is allowed.
    
    Raises:
        ValidationError: If transition is not allowed
    """
    if current_status == new_status:
        return  # Same status is always OK
    
    if current_status not in VALID_STATUS_TRANSITIONS:
        raise ValidationError(f"Unknown current status: {current_status}")
    
    allowed_statuses = VALID_STATUS_TRANSITIONS[current_status]
    
    if new_status not in allowed_statuses:
        raise ValidationError(
            f"Cannot transition from {current_status} to {new_status}. "
            f"Allowed transitions: {', '.join(allowed_statuses)}"
        )


def is_asset_available_for_assignment(status: str) -> bool:
    """Check if asset can be assigned given its current status."""
    from apps.core.constants import AVAILABLE_STATUSES
    return status in AVAILABLE_STATUSES