# django-backend/apps/core/constants.py

from django.db import models


class _AssetStatusMeta(type(models.TextChoices)):
    """Expose legacy aliases without including them in AssetStatus.choices."""

    _LEGACY_ALIASES = {
        "FOUND": "found",
        "PROCURED": "procured",
        "RECEIVED": "received",
        "IN_STOCK": "in_stock",
        "READY": "ready",
        "IN_USE": "in_use",
        "OVERDUE": "overdue",
        "RETURNED": "returned",
        "DAMAGED": "damaged",
    }

    def __getattr__(cls, name):
        if name in cls._LEGACY_ALIASES:
            return cls._LEGACY_ALIASES[name]
        return super().__getattr__(name)


class AssetStatus(models.TextChoices, metaclass=_AssetStatusMeta):
    """Canonical asset lifecycle states shown in the application."""

    AVAILABLE = "available", "Available (not assigned)"
    ASSIGNED = "assigned", "Assigned to user"
    MAINTENANCE = "maintenance", "Under maintenance"
    DISPOSED = "disposed", "Disposed"
    RETIRED = "retired", "Retired from service"
    LOST = "lost", "Lost/Missing"


VALID_STATUS_TRANSITIONS = {
    AssetStatus.AVAILABLE: [
        AssetStatus.ASSIGNED,
        AssetStatus.MAINTENANCE,
        AssetStatus.RETIRED,
        AssetStatus.DISPOSED,
        AssetStatus.LOST,
    ],
    AssetStatus.ASSIGNED: [
        AssetStatus.AVAILABLE,
        AssetStatus.RETURNED,
        AssetStatus.MAINTENANCE,
        AssetStatus.RETIRED,
        AssetStatus.DISPOSED,
        AssetStatus.LOST,
    ],
    AssetStatus.MAINTENANCE: [
        AssetStatus.AVAILABLE,
        AssetStatus.ASSIGNED,
        AssetStatus.RETIRED,
        AssetStatus.DISPOSED,
        AssetStatus.LOST,
    ],
    AssetStatus.RETIRED: [
        AssetStatus.AVAILABLE,
        AssetStatus.DISPOSED,
    ],
    AssetStatus.LOST: [
        AssetStatus.AVAILABLE,
    ],
    AssetStatus.DISPOSED: [],

    # Legacy compatibility entries for older records.
    AssetStatus.PROCURED: [AssetStatus.RECEIVED, AssetStatus.AVAILABLE, AssetStatus.DISPOSED],
    AssetStatus.RECEIVED: [AssetStatus.IN_STOCK, AssetStatus.AVAILABLE, AssetStatus.RETIRED, AssetStatus.DISPOSED],
    AssetStatus.IN_STOCK: [AssetStatus.AVAILABLE, AssetStatus.MAINTENANCE, AssetStatus.RETIRED, AssetStatus.DISPOSED, AssetStatus.LOST],
    AssetStatus.READY: [AssetStatus.AVAILABLE, AssetStatus.ASSIGNED, AssetStatus.MAINTENANCE, AssetStatus.RETIRED, AssetStatus.DISPOSED, AssetStatus.LOST],
    AssetStatus.IN_USE: [AssetStatus.AVAILABLE, AssetStatus.RETURNED, AssetStatus.MAINTENANCE, AssetStatus.LOST, AssetStatus.RETIRED, AssetStatus.DISPOSED],
    AssetStatus.OVERDUE: [AssetStatus.AVAILABLE, AssetStatus.MAINTENANCE, AssetStatus.LOST, AssetStatus.RETIRED, AssetStatus.DISPOSED],
    AssetStatus.RETURNED: [AssetStatus.AVAILABLE, AssetStatus.ASSIGNED, AssetStatus.MAINTENANCE, AssetStatus.RETIRED, AssetStatus.DISPOSED, AssetStatus.LOST],
    AssetStatus.DAMAGED: [AssetStatus.MAINTENANCE, AssetStatus.AVAILABLE, AssetStatus.RETIRED, AssetStatus.DISPOSED, AssetStatus.LOST],
}

TERMINAL_STATUSES = {
    AssetStatus.DISPOSED,
}

ACTIVE_STATUSES = {
    AssetStatus.ASSIGNED,
    AssetStatus.IN_USE,
}

AVAILABLE_STATUSES = {
    AssetStatus.AVAILABLE,
    AssetStatus.FOUND,
    AssetStatus.RETURNED,
    AssetStatus.READY,
    AssetStatus.IN_STOCK,
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
