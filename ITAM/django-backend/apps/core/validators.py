"""
Validators for status transitions and business rules.
Ensures data consistency across the application.
"""

from django.core.exceptions import ValidationError
from .constants import AssetStatus, VALID_STATUS_TRANSITIONS, AVAILABLE_STATUSES, TERMINAL_STATUSES


def validate_status_transition(current_status: str, new_status: str) -> None:
    """
    Validate that status transition is allowed.
    
    Args:
        current_status: Current status value
        new_status: Desired new status value
    
    Raises:
        ValidationError: If transition is not allowed
    
    Example:
        >>> validate_status_transition('available', 'assigned')  # OK
        >>> validate_status_transition('disposed', 'available')  # Raises ValidationError
    """
    # Same status is always OK (idempotent)
    if current_status == new_status:
        return
    
    # Check if current status exists
    if current_status not in VALID_STATUS_TRANSITIONS:
        raise ValidationError(f"Unknown current status: {current_status}")
    
    # Get allowed transitions
    allowed_statuses = VALID_STATUS_TRANSITIONS[current_status]
    
    # Validate the transition
    if new_status not in allowed_statuses:
        allowed_list = ", ".join(allowed_statuses) if allowed_statuses else "none"
        raise ValidationError(
            f"Cannot transition from '{current_status}' to '{new_status}'. "
            f"Allowed transitions: {allowed_list}"
        )


def is_asset_available_for_assignment(status: str) -> bool:
    """
    Check if asset can be assigned given its current status.
    
    Args:
        status: Current asset status
        
    Returns:
        bool: True if asset can be assigned
    
    Example:
        >>> is_asset_available_for_assignment('available')
        True
        >>> is_asset_available_for_assignment('in_use')
        False
    """
    return status in AVAILABLE_STATUSES


def is_terminal_status(status: str) -> bool:
    """
    Check if status is terminal (cannot transition from it).
    
    Args:
        status: Status to check
        
    Returns:
        bool: True if status is terminal
    
    Example:
        >>> is_terminal_status('retired')
        True
        >>> is_terminal_status('available')
        False
    """
    return status in TERMINAL_STATUSES


def validate_not_terminal_status(status: str) -> None:
    """
    Validate that a status is not a terminal status.
    Raises ValidationError if the status is terminal.
    
    Args:
        status: Status to check
    
    Raises:
        ValidationError: If status is terminal
    """
    if is_terminal_status(status):
        raise ValidationError(
            f"Cannot perform this action on terminal status '{status}'. "
            f"Terminal statuses cannot be changed."
        )