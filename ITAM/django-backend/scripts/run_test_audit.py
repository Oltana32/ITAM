import os
import sys
import django
import json
from datetime import date
from pathlib import Path

# Ensure project root is on PYTHONPATH so `config` is importable
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import Department
from apps.audits.models import AuditSession, AuditFinding
from django.contrib.auth import get_user_model


def main():
    # Create or get a test department
    dept, _ = Department.objects.get_or_create(name='TEST-DEPT')

    # Ensure a user exists to be the creator / lead auditor
    User = get_user_model()
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(email='test@example.local')

    # Create AuditSession
    session = AuditSession.objects.create(
        title='Automated Test Audit',
        department=dept,
        location=None,
        status='planned',
        planned_date=date.today(),
        created_by=user,
    )

    # Start the audit (mark in_progress)
    session.status = 'in_progress'
    session.save()

    # Simulate scanning an asset and creating an AuditFinding
    verification = {
        'tag_match': True,
        'serial_match': True,
        'assigned_user_correct': False,
        'location_correct': True,
    }
    # Ensure an asset exists to reference
    from apps.manufacturers.models import Manufacturer
    from apps.locations.models import Location
    from apps.assets.models import Asset
    from apps.core.constants import AssetStatus

    manu = Manufacturer.objects.first()
    if not manu:
        manu = Manufacturer.objects.create(name='Test Manufacturer')

    loc = Location.objects.first()
    if not loc:
        loc = Location.objects.create(name='Test Location')

    asset = Asset.objects.filter(tag='TEST-001').first()
    if not asset:
        asset = Asset.objects.create(
            name='Test Asset',
            tag='TEST-001',
            serial_number='SN-TEST-001',
            status=AssetStatus.AVAILABLE,
            category='laptop',
            model='TestModel',
            manufacturer=manu,
            location=loc,
        )

    finding = AuditFinding.objects.create(
        audit_session=session,
        asset=asset,
        status=AuditFinding.Status.FOUND,
        notes='Automated test scan',
        auditor=user,
        verification=verification,
        current_condition='good',
        current_location=loc,
    )

    out = {
        'session': {
            'id': session.id,
            'audit_id': session.audit_id,
            'title': session.title,
            'status': session.status,
            'department': session.department.name if session.department else None,
        },
        'finding': {
            'id': finding.id,
            'asset_tag': finding.asset.tag if finding.asset else None,
            'serial': finding.asset.serial_number if finding.asset else None,
            'verification': finding.verification,
            'current_condition': finding.current_condition,
            'notes': finding.notes,
            'result_status': finding.result_status,
        },
    }

    print(json.dumps(out, indent=2, default=str))


if __name__ == '__main__':
    main()
