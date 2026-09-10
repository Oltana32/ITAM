#!/usr/bin/env python
import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# Ensure project root is on sys.path so `config` package can be imported
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
import django
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.manufacturers.models import Manufacturer
from apps.locations.models import Location
from apps.assets.models import Asset
from apps.assignments.models import Assignment
from apps.core.constants import AssetStatus


def ensure_admin(email='devtest@local', password='devtestpass'):
    User = get_user_model()
    user, created = User.objects.get_or_create(email=email, defaults={'is_staff': True, 'is_superuser': True})
    if created:
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
    return user


def main():
    admin = ensure_admin()

    manuf, _ = Manufacturer.objects.get_or_create(name='Dev Manufacturer')
    loc, _ = Location.objects.get_or_create(name='Dev Location')

    tag = 'QRTEST-0001'
    asset, created = Asset.objects.get_or_create(
        tag=tag,
        defaults={
            'name': 'QR Test Asset',
            'serial_number': 'QRTEST-SN-0001',
            'category': 'laptop',
            'manufacturer': manuf,
            'location': loc,
            'created_by': admin,
        }
    )

    # Ensure asset is assigned
    if not asset.is_in_active_use:
        assignment = Assignment.objects.create(
            asset=asset,
            assigner=admin,
            assigned_to_name='QR User',
            employee_id='QR-1',
            location='Dev Location',
            status=AssetStatus.ASSIGNED,
        )
        print('Created assignment', assignment.id)
    else:
        assignment = asset.current_assignment
        print('Using existing assignment', assignment.id)

    client = APIClient()
    client.force_authenticate(user=admin)

    payload = {
        'asset_tag': tag,
        'inspection': {
            'inspectionDate': '2026-01-01',
            'inspectedBy': 'Dev Tester',
            'overallCondition': 'good',
            'physicalCondition': ['No visible damage'],
            'functionalTest': 'passed',
            'accessoriesReturned': ['Charger'],
            'missingAccessories': '',
            'requiresMaintenance': False,
            'maintenanceIssue': '',
            'dataWiped': 'yes',
            'finalAssetStatus': 'available',
            'inspectionRemarks': 'OK',
            'employeeSignature': 'QR User',
            'itStaffSignature': 'Dev Tester',
            'returnedBy': 'QR User',
            'receivedBy': 'Dev Tester',
        }
    }

    resp = client.post('/api/assignments/return-by-tag/', payload, format='json')
    print('Response status:', resp.status_code)
    try:
        print('Response data:', resp.json())
    except Exception:
        print('Response content:', resp.content)


if __name__ == '__main__':
    main()
