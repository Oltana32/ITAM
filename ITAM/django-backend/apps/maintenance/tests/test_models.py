from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from apps.assets.models import Asset
from apps.assignments.models import Assignment
from apps.core.constants import AssetStatus
from apps.locations.models import Location
from apps.maintenance.models import MaintenanceRecord, MaintenanceStatus, MaintenanceType
from apps.manufacturers.models import Manufacturer


User = get_user_model()


class MaintenanceLifecycleTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.manufacturer, _ = Manufacturer.objects.get_or_create(
            name="Dell",
            defaults={"support_email": "support@dell.com"},
        )
        cls.location = Location.objects.create(name="Maintenance Lab")
        cls.user = User.objects.create_user(
            email="maintenance@test.com",
            password="testpass123",
        )

    def create_asset(self, tag="MNT001", serial_number="MNT-SN001"):
        return Asset.objects.create(
            name="Maintenance Laptop",
            tag=tag,
            serial_number=serial_number,
            category="laptop",
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.user,
        )

    def test_in_progress_maintenance_marks_asset_under_maintenance(self):
        asset = self.create_asset()

        MaintenanceRecord.objects.create(
            asset=asset,
            type=MaintenanceType.PREVENTIVE,
            schedule_date=timezone.now().date(),
            status=MaintenanceStatus.IN_PROGRESS,
            technician=self.user,
        )

        asset.refresh_from_db()
        self.assertEqual(asset.status, AssetStatus.MAINTENANCE)

    def test_completed_maintenance_releases_asset_to_available(self):
        asset = self.create_asset()
        record = MaintenanceRecord.objects.create(
            asset=asset,
            type=MaintenanceType.PREVENTIVE,
            schedule_date=timezone.now().date(),
            status=MaintenanceStatus.IN_PROGRESS,
            technician=self.user,
        )

        record.status = MaintenanceStatus.COMPLETED
        record.save()

        asset.refresh_from_db()
        record.refresh_from_db()
        self.assertEqual(asset.status, AssetStatus.AVAILABLE)
        self.assertIsNotNone(record.completed_date)

    def test_maintenance_can_start_for_active_assignment_without_reassigning_asset(self):
        asset = self.create_asset(tag="MNT002", serial_number="MNT-SN002")
        assignment = Assignment.objects.create(
            asset=asset,
            assigner=self.user,
            assigned_to_name="Assigned User",
            employee_id="EMP-MNT",
            location="Office",
            status=AssetStatus.ASSIGNED,
        )

        record = MaintenanceRecord.objects.create(
            asset=asset,
            type=MaintenanceType.CORRECTIVE,
            schedule_date=timezone.now().date(),
            status=MaintenanceStatus.IN_PROGRESS,
            technician=self.user,
            cost="250.00",
        )

        assignment.refresh_from_db()
        asset.refresh_from_db()
        self.assertEqual(asset.status, AssetStatus.MAINTENANCE)
        self.assertEqual(assignment.assigned_to_user, None)
        self.assertEqual(assignment.assigned_to_name, "Assigned User")
        self.assertEqual(record.previous_assignee_name, "Assigned User")

        record.status = MaintenanceStatus.COMPLETED
        record.save()

        assignment.refresh_from_db()
        asset.refresh_from_db()
        self.assertEqual(asset.status, AssetStatus.ASSIGNED)
        self.assertEqual(assignment.assigned_to_name, "Assigned User")
        self.assertEqual(record.previous_assignee_name, "Assigned User")

    def test_cost_is_required_for_maintenance_record(self):
        asset = self.create_asset(tag="MNT003", serial_number="MNT-SN003")

        with self.assertRaises(ValidationError):
            MaintenanceRecord.objects.create(
                asset=asset,
                type=MaintenanceType.PREVENTIVE,
                schedule_date=timezone.now().date(),
                status=MaintenanceStatus.SCHEDULED,
                technician=self.user,
                cost=None,
            )

    def test_completed_maintenance_returns_asset_to_previous_owner(self):
        asset = self.create_asset(tag="MNT004", serial_number="MNT-SN004")
        assignment = Assignment.objects.create(
            asset=asset,
            assigner=self.user,
            assigned_to_name="Previous Owner",
            employee_id="EMP-OWNER",
            location="HQ",
            status=AssetStatus.ASSIGNED,
        )

        record = MaintenanceRecord.objects.create(
            asset=asset,
            type=MaintenanceType.CORRECTIVE,
            schedule_date=timezone.now().date(),
            status=MaintenanceStatus.IN_PROGRESS,
            technician=self.user,
            cost="125.50",
        )

        asset.refresh_from_db()
        self.assertEqual(asset.status, AssetStatus.MAINTENANCE)
        self.assertEqual(assignment.status, AssetStatus.ASSIGNED)

        record.status = MaintenanceStatus.COMPLETED
        record.save()

        asset.refresh_from_db()
        assignment.refresh_from_db()
        self.assertEqual(asset.status, AssetStatus.ASSIGNED)
        self.assertEqual(assignment.status, AssetStatus.ASSIGNED)
        self.assertEqual(assignment.assigned_to_name, "Previous Owner")
