"""Asset change history logging."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from apps.core.constants import AssetStatus

if TYPE_CHECKING:
    from django.contrib.auth.models import AbstractUser

    from .models import Asset, AssetStatusHistory


FIELD_LABELS: dict[str, str] = {
    "name": "Name",
    "status": "Status",
    "category": "Category",
    "condition": "Condition",
    "location": "Location",
    "manufacturer": "Manufacturer",
    "model": "Model",
    "serial_number": "Serial Number",
    "department": "Department",
    "notes": "Notes",
    "purchase_date": "Purchase Date",
    "purchase_cost": "Purchase Cost",
    "warranty_expiry": "Warranty Expiry",
    "useful_life_years": "Useful Life (Years)",
    "residual_value": "Residual Value",
    "depreciation_method": "Depreciation Method",
}

TRACKED_FIELDS = tuple(FIELD_LABELS.keys())


def _status_label(value: str) -> str:
    return dict(AssetStatus.choices).get(value, value or "—")


def _field_display(asset: Asset, field: str) -> str:
    if field == "location":
        return asset.location.name if asset.location_id else "—"
    if field == "manufacturer":
        return asset.manufacturer.name if asset.manufacturer_id else "—"
    if field == "status":
        return _status_label(asset.status)
    if field == "category":
        return asset.get_category_display()
    if field == "condition":
        return asset.get_condition_display()
    value = getattr(asset, field, None)
    if value is None or value == "":
        return "—"
    return str(value)


def log_asset_change(
    asset: Asset,
    *,
    changed_by: AbstractUser | None = None,
    change_type: str = "field",
    field_name: str = "",
    old_value: str = "",
    new_value: str = "",
    from_status: str = "",
    to_status: str = "",
    reason: str = "",
) -> AssetStatusHistory:
    """Create a history record for an asset change."""
    from .models import AssetStatusHistory

    return AssetStatusHistory.objects.create(
        asset=asset,
        asset_tag=asset.tag if asset else "",
        change_type=change_type,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        from_status=from_status,
        to_status=to_status,
        changed_by=changed_by,
        reason=reason,
    )


def log_status_change(
    asset: Asset,
    old_status: str,
    new_status: str,
    changed_by: AbstractUser | None = None,
    reason: str = "",
) -> AssetStatusHistory:
    """Log a status transition."""
    return log_asset_change(
        asset,
        changed_by=changed_by,
        change_type="status",
        field_name="status",
        old_value=_status_label(old_status),
        new_value=_status_label(new_status),
        from_status=old_status,
        to_status=new_status,
        reason=reason,
    )


def log_field_change(
    asset: Asset,
    field_name: str,
    old_asset: Asset,
    changed_by: AbstractUser | None = None,
    reason: str = "",
) -> AssetStatusHistory | None:
    """Log a single field change between two asset states."""
    old_display = _field_display(old_asset, field_name)
    new_display = _field_display(asset, field_name)
    if old_display == new_display:
        return None

    kwargs: dict[str, Any] = {
        "changed_by": changed_by,
        "change_type": "status" if field_name == "status" else "field",
        "field_name": field_name,
        "old_value": old_display,
        "new_value": new_display,
        "reason": reason,
    }
    if field_name == "status":
        kwargs["from_status"] = old_asset.status
        kwargs["to_status"] = asset.status

    return log_asset_change(asset, **kwargs)


def log_asset_creation(asset: Asset, changed_by: AbstractUser | None = None) -> AssetStatusHistory:
    """Log initial asset creation."""
    return log_asset_change(
        asset,
        changed_by=changed_by,
        change_type="create",
        field_name="asset",
        old_value="—",
        new_value=f"{asset.tag} — {asset.name}",
        from_status="",
        to_status=asset.status,
        reason="Asset created",
    )


def log_asset_updates(
    asset: Asset,
    old_asset: Asset,
    changed_by: AbstractUser | None = None,
    fields: tuple[str, ...] = TRACKED_FIELDS,
    reason: str = "",
) -> list[AssetStatusHistory]:
    """Log all changed fields between two asset states."""
    entries: list[AssetStatusHistory] = []
    for field_name in fields:
        entry = log_field_change(
            asset,
            field_name,
            old_asset,
            changed_by=changed_by,
            reason=reason,
        )
        if entry:
            entries.append(entry)
    return entries
