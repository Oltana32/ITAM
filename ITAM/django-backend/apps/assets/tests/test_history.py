from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.assets.models import Asset, AssetStatusHistory
from apps.core.constants import AssetStatus
from apps.locations.models import Location
from apps.manufacturers.models import Manufacturer
from apps.users.models import UserRole

User = get_user_model()


class AssetHistoryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.manufacturer, _ = Manufacturer.objects.get_or_create(
            name="History Manufacturer",
            defaults={"support_email": "hist@example.com"},
        )
        cls.location = Location.objects.create(name="History Location", code="HISTLOC")
        cls.admin = User.objects.create_user(
            email="admin@hist.com",
            password="pass12345",
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="User",
        )
        cls.it_user = User.objects.create_user(
            email="it@hist.com",
            password="pass12345",
            role=UserRole.IT_TEAM,
            first_name="IT",
            last_name="Staff",
        )

    def setUp(self):
        self.client = APIClient()
        self.asset = Asset.objects.create(
            name="History Laptop",
            serial_number="SN-HIST-1",
            category="laptop",
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.it_user,
        )

    def test_creation_logs_history_via_api(self):
        self.client.force_authenticate(user=self.it_user)
        response = self.client.post(
            "/api/assets/",
            {
                "name": "API Created Laptop",
                "serial_number": "SN-API-1",
                "category": "desktop",
                "manufacturer": self.manufacturer.id,
                "location": self.location.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        asset = Asset.objects.get(serial_number="SN-API-1")
        entry = asset.status_history.filter(change_type="create").first()
        self.assertIsNotNone(entry)
        self.assertEqual(entry.changed_by, self.it_user)

    def test_status_change_logs_who_what_when(self):
        self.asset.change_status(
            AssetStatus.MAINTENANCE,
            changed_by=self.admin,
            reason="Scheduled service",
        )
        entry = self.asset.status_history.filter(change_type="status").latest("changed_at")
        self.assertEqual(entry.changed_by, self.admin)
        self.assertEqual(entry.old_value, "Available (not assigned)")
        self.assertEqual(entry.new_value, "Under maintenance")
        self.assertEqual(entry.reason, "Scheduled service")

    def test_api_update_logs_field_changes(self):
        self.client.force_authenticate(user=self.it_user)
        response = self.client.patch(
            f"/api/assets/{self.asset.id}/",
            {"name": "Updated Laptop Name", "department": "Finance"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        field_entries = self.asset.status_history.filter(change_type="field")
        self.assertGreaterEqual(field_entries.count(), 2)
        names = list(field_entries.values_list("field_name", flat=True))
        self.assertIn("name", names)
        self.assertIn("department", names)

    def test_history_api_endpoint(self):
        self.asset.change_status(AssetStatus.ASSIGNED, changed_by=self.it_user)
        self.client.force_authenticate(user=self.it_user)
        response = self.client.get(f"/api/assets/{self.asset.id}/history/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertIn("changed_by_name", response.data[0])
        self.assertIn("summary", response.data[0])
