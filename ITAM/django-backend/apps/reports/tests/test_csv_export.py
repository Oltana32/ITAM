import csv
import io

from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.assets.models import Asset
from apps.reports.services import (
    generate_asset_report,
    generate_assignment_report,
    generate_license_report,
    generate_maintenance_report,
)
from apps.locations.models import Location
from apps.manufacturers.models import Manufacturer

User = get_user_model()


class ReportCsvExportTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.manufacturer, _ = Manufacturer.objects.get_or_create(
            name="Report Test Manufacturer",
            defaults={"support_email": "report@example.com"},
        )
        cls.location = Location.objects.create(name="Report Location", code="RPTLOC")
        cls.user = User.objects.create_user(email="reporttest@example.com", password="testpass123")

    def _read_csv(self, buffer: io.BytesIO) -> list[list[str]]:
        buffer.seek(0)
        text = buffer.read().decode("utf-8-sig")
        return list(csv.reader(io.StringIO(text)))

    def test_asset_report_is_csv_with_headers(self):
        Asset.objects.create(
            name="Test Laptop",
            tag="AW-LAP-0001",
            serial_number="SN-RPT-1",
            category="laptop",
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.user,
        )
        rows = self._read_csv(generate_asset_report())
        self.assertEqual(rows[0], ["Asset Tag", "Asset Name", "Category", "Status", "Location"])
        self.assertEqual(rows[1][0], "AW-LAP-0001")
        self.assertEqual(rows[1][1], "Test Laptop")

    def test_assignment_report_csv_has_header_row(self):
        rows = self._read_csv(generate_assignment_report())
        self.assertEqual(rows[0][0], "Asset Tag")
        self.assertGreaterEqual(len(rows[0]), 7)

    def test_maintenance_report_csv_has_header_row(self):
        rows = self._read_csv(generate_maintenance_report())
        self.assertEqual(rows[0][2], "Work Order ID")

    def test_license_report_csv_has_header_row(self):
        rows = self._read_csv(generate_license_report())
        self.assertEqual(rows[0][0], "Software Name")
