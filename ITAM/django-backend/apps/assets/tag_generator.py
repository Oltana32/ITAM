# django-backend/apps/assets/tag_generator.py

"""
Centralized asset tag generation system.

Asset tags follow the format: AW-[CATEGORY]-[SEQUENCE_NUMBER]
Examples: AW-LAP-0001, AW-PHO-0001, AW-DES-0001

This module ensures:
- Tags are auto-generated backend-side only
- No frontend tag generation
- No duplicate tags
- Sequential numbering per category prefix
"""

import re
from typing import Dict

from django.db import transaction

# Matches standard tags like AW-LAP-0001 (ignores legacy formats).
_TAG_SEQUENCE_RE = re.compile(r"^AW-([A-Z]{3})-(\d{4})$")
TAG_PREFIX = "AW"

# Category prefix mapping (3-letter codes)
CATEGORY_PREFIX_MAP: Dict[str, str] = {
    "laptop": "LAP",
    "desktop": "DES",
    "monitor": "MON",
    "server": "SRV",
    "phone": "PHO",
    "tablet": "TAB",
    "network": "NET",
    "equipment": "EQP",
    "other": "OTH",
}


def get_category_prefix(category: str) -> str:
    """Get the 3-letter prefix for a given asset category."""
    return CATEGORY_PREFIX_MAP.get(category, "OTH")


@transaction.atomic
def generate_asset_tag(category: str) -> str:
    """
    Generate a unique asset tag based on category.

    Thread-safe generation using database transaction and select_for_update.

    Args:
        category: Asset category value

    Returns:
        Generated tag string (e.g., "AW-LAP-0001")

    Raises:
        ValueError: If category is invalid
    """
    from .models import Asset  # Late import to avoid circular dependency

    if category not in CATEGORY_PREFIX_MAP:
        raise ValueError(f"Invalid category: {category}")

    prefix = CATEGORY_PREFIX_MAP[category]
    tag_prefix = f"{TAG_PREFIX}-{prefix}"

    existing_tags = (
        Asset.objects
        .filter(tag__startswith=f"{tag_prefix}-")
        .select_for_update()
        .values_list("tag", flat=True)
    )

    max_number = 0
    for tag in existing_tags:
        match = _TAG_SEQUENCE_RE.match(tag)
        if match and match.group(1) == prefix:
            max_number = max(max_number, int(match.group(2)))

    next_number = max_number + 1

    for _ in range(1000):
        new_tag = f"{tag_prefix}-{next_number:04d}"
        if not Asset.objects.filter(tag=new_tag).exists():
            return new_tag
        next_number += 1

    raise RuntimeError(
        f"Unable to generate unique tag for category '{category}'. Contact system admin."
    )


def validate_tag_format(tag: str) -> bool:
    """
    Validate that a tag follows the expected AW-XXX-XXXX format.

    Args:
        tag: Tag to validate

    Returns:
        True if valid format, False otherwise
    """
    if not tag or not isinstance(tag, str):
        return False

    match = _TAG_SEQUENCE_RE.match(tag)
    if not match:
        return False

    return match.group(1) in CATEGORY_PREFIX_MAP.values()
