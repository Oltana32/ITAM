from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.assets.models import Asset, AssetStatusHistory
from apps.locations.models import Location
from apps.manufacturers.models import Manufacturer
from apps.users.models import UserRole

User = get_user_model()


class AssetDeletionHistoryTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.manufacturer, _ = Manufacturer.objects.get_or_create(
            name="DeleteTest Manufacturer",
            defaults={"support_email": "deleteme@example.com"},
        )
        cls.location = Location.objects.create(name="DeleteTest Location", code="DELLOC")
        cls.admin = User.objects.create_user(
            email="admin-delete@example.com",
            password="pass12345",
            role=UserRole.ADMIN,
            first_name="Admin",
            last_name="Delete",
        )

    def setUp(self):
        self.asset = Asset.objects.create(
            name="Delete History Laptop",
            serial_number="SN-DEL-1",
            category="laptop",
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.admin,
        )

    def test_asset_delete_preserves_status_history(self):
        self.asset.change_status("retired", changed_by=self.admin, reason="Retire for test")
        history_count = AssetStatusHistory.objects.count()
        expected_tag = self.asset.tag
        self.asset.delete()

        self.assertEqual(Asset.objects.filter(pk=self.asset.pk).count(), 0)
        self.assertEqual(AssetStatusHistory.objects.count(), history_count)
        entry = AssetStatusHistory.objects.first()
        self.assertIsNone(entry.asset)
        self.assertEqual(entry.asset_tag, expected_tag)
