from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.manufacturers.models import Manufacturer
from apps.locations.models import Location
from apps.assets.models import Asset
from apps.assignments.models import Assignment
from apps.users.models import UserRole

User = get_user_model()


class BulkAssignTests(TestCase):
    def setUp(self):
        self.manufacturer, _ = Manufacturer.objects.get_or_create(name="MfgCoAssign")
        self.location = Location.objects.create(name="Assign Office")
        self.user = User.objects.create_user(email="admin@assign.com", password="pass123", role=UserRole.ADMIN)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.asset1 = Asset.objects.create(name="A1", category="laptop", manufacturer=self.manufacturer, location=self.location, serial_number="AS1", created_by=self.user)
        self.asset2 = Asset.objects.create(name="A2", category="laptop", manufacturer=self.manufacturer, location=self.location, serial_number="AS2", created_by=self.user)
        # Assign asset2 so it is unavailable
        Assignment.objects.create(asset=self.asset2, assigned_to_name="Existing", employee_id="E1", location="HQ", assigner=self.user)

    def test_bulk_assign_skips_already_assigned(self):
        payload = {
            "asset_ids": [self.asset1.id, self.asset2.id],
            "assigned_to_name": "Jane Doe",
            "employee_id": "E-1023",
            "department": "Finance",
            "email": "jane@company.com",
            "location": "HQ - 3rd Floor",
        }
        response = self.client.post("/api/assignments/bulk-assign/", payload, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["summary"]["requested"], 2)
        self.assertEqual(data["summary"]["created"], 1)
        self.assertEqual(data["summary"]["failed"], 1)