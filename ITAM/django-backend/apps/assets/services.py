"""Business logic for assets (keep views thin)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import transaction

if TYPE_CHECKING:
    from apps.locations.models import Location

    from .models import Asset


def generate_asset_tag(category: str) -> str:
    """Generate a sequential asset tag based on category.
    
    This function delegates to the dedicated tag_generator module which provides
    thread-safe, race-condition-free tag generation.
    
    Examples:
    - Laptop → AW-LAP-0001, AW-LAP-0002
    - Phone → AW-PHO-0001
    - Desktop → AW-DES-0001
    """
    from .tag_generator import generate_asset_tag as generate_tag_secure
    return generate_tag_secure(category)


@transaction.atomic
def set_asset_location(asset: Asset, location: Location) -> Asset:
    """Move asset to another location (auditable side effects can be added here)."""
    asset.location = location
    asset.save(update_fields=["location", "updated_at"])
    return asset


@transaction.atomic
def retire_asset(asset: Asset) -> Asset:
    from .models import AssetStatus

    asset.status = AssetStatus.RETIRED
    asset.save(update_fields=["status", "updated_at"])
    return asset
