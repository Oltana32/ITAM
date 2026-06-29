# django-backend/apps/core/constants.py

from django.db import models

class AssetStatus(models.TextChoices):
    """Unified asset status - single source of truth for entire system."""
    
    # Procurement states - asset lifecycle from procurement through receipt
    PROCURED = "procured", "Procured (ordered, not yet received)"
    RECEIVED = "received", "Received (in warehouse, not yet processed)"
    IN_STOCK = "in_stock", "In Stock (ready for assignment)"
    
    # Available states (can be assigned)
    READY = "ready", "Ready (not yet assigned)"
    AVAILABLE = "available", "Available (not assigned)"
    
    # Active use states
    ASSIGNED = "assigned", "Assigned to user"
    IN_USE = "in_use", "In use by assignee"
    
    # Temporary states
    MAINTENANCE = "maintenance", "Under maintenance"
    OVERDUE = "overdue", "Return overdue"
    
    # Return/recovery states
    RETURNED = "returned", "Returned (processing)"
    FOUND = "found", "Found (was lost, now recovered)"
    
    # Final states (terminal)
    RETIRED = "retired", "Retired from service"
    DISPOSED = "disposed", "Disposed"
    LOST = "lost", "Lost/Missing"
    DAMAGED = "damaged", "Damaged (non-repairable)"
    
    class Meta:
        verbose_name = "Asset Status"
        verbose_name_plural = "Asset Statuses"


# Define allowed state transitions
VALID_STATUS_TRANSITIONS = {
    # From -> [allowed to states]
    # Procurement workflow
    AssetStatus.PROCURED: [
        AssetStatus.RECEIVED,
        AssetStatus.RETIRED,  # Can retire if order is cancelled
    ],
    AssetStatus.RECEIVED: [
        AssetStatus.IN_STOCK,
        AssetStatus.DAMAGED,  # Can be damaged on receipt
        AssetStatus.RETIRED,
    ],
    AssetStatus.IN_STOCK: [
        AssetStatus.AVAILABLE,
        AssetStatus.READY,
        AssetStatus.MAINTENANCE,
        AssetStatus.RETIRED,
    ],
    
    # Ready/Available states
    AssetStatus.READY: [
        AssetStatus.AVAILABLE,
        AssetStatus.ASSIGNED,
        AssetStatus.MAINTENANCE,
        AssetStatus.RETIRED,
    ],
    AssetStatus.AVAILABLE: [
        AssetStatus.ASSIGNED,
        AssetStatus.MAINTENANCE,
        AssetStatus.RETIRED,
    ],
    
    # Active use
    AssetStatus.ASSIGNED: [
        AssetStatus.IN_USE,
        AssetStatus.RETURNED,
        AssetStatus.MAINTENANCE,
        AssetStatus.OVERDUE,
        AssetStatus.LOST,
        AssetStatus.DAMAGED,
    ],
    AssetStatus.IN_USE: [
        AssetStatus.RETURNED,
        AssetStatus.MAINTENANCE,
        AssetStatus.OVERDUE,
        AssetStatus.LOST,
        AssetStatus.DAMAGED,
    ],
    
    # Maintenance workflow
    AssetStatus.MAINTENANCE: [
        AssetStatus.AVAILABLE,
        AssetStatus.ASSIGNED,
        AssetStatus.IN_STOCK,
        AssetStatus.DAMAGED,
        AssetStatus.RETIRED,
    ],
    
    # Return/Recovery
    AssetStatus.RETURNED: [
        AssetStatus.AVAILABLE,
        AssetStatus.ASSIGNED,
        AssetStatus.MAINTENANCE,
        AssetStatus.RETIRED,
        AssetStatus.DAMAGED,
        AssetStatus.IN_STOCK,
    ],
    AssetStatus.OVERDUE: [
        AssetStatus.RETURNED,
        AssetStatus.LOST,
        AssetStatus.DAMAGED,
    ],
    AssetStatus.LOST: [
        AssetStatus.FOUND,  # Can be recovered
        AssetStatus.RETIRED,
    ],
    AssetStatus.FOUND: [
        AssetStatus.AVAILABLE,  # If recovered, back to available
        AssetStatus.ASSIGNED,
        AssetStatus.DAMAGED,    # Or might be damaged when found
        AssetStatus.MAINTENANCE,
        AssetStatus.IN_STOCK,
    ],
    
    # Damage/Disposal
    AssetStatus.DAMAGED: [
        AssetStatus.MAINTENANCE,
        AssetStatus.RETIRED,
        AssetStatus.DISPOSED,
    ],
    
    # Terminal states
    AssetStatus.RETIRED: [
        # Terminal state - no transitions allowed
    ],
    AssetStatus.DISPOSED: [
        # Terminal state - no transitions allowed
    ],
}


# Terminal (final) states - cannot change from these
TERMINAL_STATUSES = {
    AssetStatus.RETIRED,
    AssetStatus.DISPOSED,
}

# Active states - asset is being actively used
ACTIVE_STATUSES = {
    AssetStatus.ASSIGNED,
    AssetStatus.IN_USE,
}

# Available states - can be assigned
AVAILABLE_STATUSES = {
    AssetStatus.READY,
    AssetStatus.AVAILABLE,
    AssetStatus.IN_STOCK,
    AssetStatus.RETURNED,
    AssetStatus.FOUND,
}

# Problematic states - need action
PROBLEM_STATUSES = {
    AssetStatus.MAINTENANCE,
    AssetStatus.OVERDUE,
    AssetStatus.LOST,
    AssetStatus.DAMAGED,
}

# Procurement states - asset is in procurement pipeline
PROCUREMENT_STATUSES = {
    AssetStatus.PROCURED,
    AssetStatus.RECEIVED,
}

# Pre-assignment states - asset hasn't been assigned yet
PRE_ASSIGNMENT_STATUSES = {
    AssetStatus.PROCURED,
    AssetStatus.RECEIVED,
    AssetStatus.IN_STOCK,
    AssetStatus.READY,
    AssetStatus.AVAILABLE,
}
