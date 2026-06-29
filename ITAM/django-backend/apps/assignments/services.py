"""Assignment workflows (status transitions, asset linkage)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import transaction

from apps.core.constants import AssetStatus

if TYPE_CHECKING:
    from apps.assets.models import Asset

    from .models import Assignment


@transaction.atomic
def apply_assignment_to_asset(assignment) -> None:
    """Keep asset.status aligned when an assignment is active or returned."""
    from .models import Assignment

    if not isinstance(assignment, Assignment):
        return
    asset = assignment.asset
    if assignment.status in [AssetStatus.ASSIGNED, AssetStatus.IN_USE]:
        if asset.status in [AssetStatus.READY, AssetStatus.AVAILABLE, AssetStatus.RETURNED, AssetStatus.FOUND]:
            asset.change_status(AssetStatus.ASSIGNED, changed_by=assignment.assigner)
    elif assignment.status == AssetStatus.RETURNED:
        if not _has_other_active(asset, exclude_pk=assignment.pk):
            asset.change_status(AssetStatus.RETURNED, changed_by=assignment.updated_by)


def _has_other_active(asset: Asset, exclude_pk: int | None) -> bool:
    from .models import Assignment

    qs = Assignment.objects.filter(
        asset=asset,
        status__in=[AssetStatus.ASSIGNED, AssetStatus.IN_USE],
    )
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    return qs.exists()
