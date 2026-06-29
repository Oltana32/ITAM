from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.assets.models import Asset
from apps.assets.tag_generator import generate_asset_tag, validate_tag_format
from apps.locations.models import Location
from apps.manufacturers.models import Manufacturer

User = get_user_model()


class TagGeneratorTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.manufacturer, _ = Manufacturer.objects.get_or_create(
            name="Test Manufacturer",
            defaults={"support_email": "test@example.com"},
        )
        cls.location = Location.objects.create(name="Test Location", code="TESTLOC")
        cls.user = User.objects.create_user(email="tagtest@example.com", password="testpass123")

    def _create_asset(self, tag: str, serial: str, category: str = "laptop") -> Asset:
        return Asset.objects.create(
            name=f"Asset {tag}",
            tag=tag,
            serial_number=serial,
            category=category,
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.user,
        )

    def test_generates_first_laptop_tag(self):
        self.assertEqual(generate_asset_tag("laptop"), "AW-LAP-0001")

    def test_generates_first_phone_tag(self):
        self.assertEqual(generate_asset_tag("phone"), "AW-PHO-0001")

    def test_generates_first_desktop_tag(self):
        self.assertEqual(generate_asset_tag("desktop"), "AW-DES-0001")

    def test_increments_per_category(self):
        self._create_asset("AW-LAP-0001", "SN-SEQ-1", "laptop")
        self.assertEqual(generate_asset_tag("laptop"), "AW-LAP-0002")
        self.assertEqual(generate_asset_tag("phone"), "AW-PHO-0001")

    def test_skips_legacy_tags(self):
        self._create_asset("AW-0001", "SN-LEGACY-1", "laptop")
        self._create_asset("LAP-0FDC1B", "SN-LEGACY-2", "laptop")
        self.assertEqual(generate_asset_tag("laptop"), "AW-LAP-0001")

    def test_validate_tag_format(self):
        self.assertTrue(validate_tag_format("AW-LAP-0001"))
        self.assertTrue(validate_tag_format("AW-PHO-0001"))
        self.assertFalse(validate_tag_format("AW-0001"))
        self.assertFalse(validate_tag_format("LAP-0001"))

    def test_auto_generates_on_asset_create(self):
        asset = Asset.objects.create(
            name="Auto Tagged Asset",
            serial_number="SN-AUTO-1",
            category="laptop",
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.user,
        )
        self.assertEqual(asset.tag, "AW-LAP-0001")
        self.assertTrue(validate_tag_format(asset.tag))
