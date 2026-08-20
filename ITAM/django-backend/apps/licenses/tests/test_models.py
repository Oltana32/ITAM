from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.licenses.models import LicenseAssignment, SoftwareLicense
from apps.licenses.serializers import SoftwareLicenseSerializer


User = get_user_model()


class LicenseSeatAllocationTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            email="license-user1@test.com",
            password="testpass123",
        )
        self.user2 = User.objects.create_user(
            email="license-user2@test.com",
            password="testpass123",
        )
        self.license = SoftwareLicense.objects.create(
            software_name="Design Suite",
            seats=1,
        )

    def test_tracks_allocated_and_available_seats(self):
        LicenseAssignment.objects.create(
            license=self.license,
            assigned_to_user=self.user1,
        )

        self.assertEqual(self.license.allocated_seats, 1)
        self.assertEqual(self.license.available_seats, 0)

    def test_prevents_over_allocation(self):
        LicenseAssignment.objects.create(
            license=self.license,
            assigned_to_user=self.user1,
        )

        with self.assertRaises(ValidationError):
            LicenseAssignment.objects.create(
                license=self.license,
                assigned_to_user=self.user2,
            )

    def test_prevents_reducing_seats_below_active_allocations(self):
        LicenseAssignment.objects.create(
            license=self.license,
            assigned_to_user=self.user1,
        )

        self.license.seats = 0
        with self.assertRaises(ValidationError):
            self.license.save()

    def test_serializer_exposes_usage_status_and_cost_metadata(self):
        self.license.seats = 3
        self.license.annual_cost = 1500
        self.license.expiry_date = "2030-12-31"
        self.license.save()

        LicenseAssignment.objects.create(
            license=self.license,
            assigned_to_user=self.user1,
        )

        payload = SoftwareLicenseSerializer(self.license).data

        self.assertEqual(payload["allocated_seats"], 1)
        self.assertEqual(payload["available_seats"], 2)
        self.assertEqual(payload["used_seats"], 1)
        self.assertEqual(payload["status"], "active")
        self.assertEqual(payload["cost_per_seat"], "500.00")
        self.assertEqual(payload["total_annual_cost"], "1500.00")

    def test_active_users_field_is_serialized_and_saved(self):
        self.license.seats = 5
        self.license.active_users = 2
        self.license.save()

        payload = SoftwareLicenseSerializer(self.license).data

        self.assertEqual(payload["active_users"], 2)
        self.assertEqual(self.license.active_users, 2)
