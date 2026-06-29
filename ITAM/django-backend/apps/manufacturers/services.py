"""Manufacturer services - derive from real data."""

from django.db.models import Q


def get_real_manufacturers():
    """Get actual manufacturers/vendors from Assets, Licenses, and Software records.
    
    Returns unique list of manufacturers that have actual records.
    """
    from apps.assets.models import Asset
    from apps.licenses.models import SoftwareLicense
    
    manufacturers = set()
    
    # Get manufacturers from assets
    asset_manufacturers = Asset.objects.values_list(
        "manufacturer__name", flat=True
    ).distinct().exclude(manufacturer__name__isnull=True)
    
    manufacturers.update(asset_manufacturers)
    
    # Get vendors from licenses
    license_vendors = SoftwareLicense.objects.values_list(
        "vendor", flat=True
    ).distinct().exclude(vendor__in=[None, ""])
    
    # Convert vendor choices to display names
    from apps.licenses.models import Vendor
    vendor_display_map = {choice[0]: choice[1] for choice in Vendor.choices}
    
    for vendor in license_vendors:
        if vendor in vendor_display_map:
            manufacturers.add(vendor_display_map[vendor])
        else:
            manufacturers.add(vendor)
    
    return sorted(list(manufacturers))


def create_or_update_manufacturers():
    """Sync real manufacturers with the Manufacturer model.
    
    Creates Manufacturer records for real vendors found in the system.
    """
    from apps.manufacturers.models import Manufacturer
    
    real_vendors = get_real_manufacturers()
    
    # Get existing manufacturers
    existing = set(Manufacturer.objects.values_list("name", flat=True))
    
    # Create new manufacturer records for vendors not yet in the model
    new_manufacturers = []
    for vendor_name in real_vendors:
        if vendor_name and vendor_name not in existing:
            new_manufacturers.append(Manufacturer(name=vendor_name))
    
    if new_manufacturers:
        Manufacturer.objects.bulk_create(new_manufacturers, ignore_conflicts=True)
    
    return len(new_manufacturers)
