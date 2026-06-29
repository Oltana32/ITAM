import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.assets.models import Asset, AssetStatus
from apps.assignments.models import Assignment, AssignmentStatus

# Update all active assignments to returned
returned = Assignment.objects.filter(status=AssignmentStatus.ACTIVE).update(status=AssignmentStatus.RETURNED)
print(f"Updated {returned} assignments to returned status")

# Clear assigned_to, employee_id, allocated_at and set status to available
updated = Asset.objects.filter(status=AssetStatus.IN_USE).update(
    status=AssetStatus.AVAILABLE,
    assigned_to='',
    employee_id='',
    allocated_at=None
)
print(f"Updated {updated} assets to available status")

# Show summary
in_use_count = Asset.objects.filter(status=AssetStatus.IN_USE).count()
available_count = Asset.objects.filter(status=AssetStatus.AVAILABLE).count()
active_assignments = Assignment.objects.filter(status=AssignmentStatus.ACTIVE).count()

print(f"\nSummary:")
print(f"Assets in use: {in_use_count}")
print(f"Assets available: {available_count}")
print(f"Active assignments: {active_assignments}")
