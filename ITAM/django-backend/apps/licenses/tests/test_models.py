from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.licenses.models import LicenseAssignment, SoftwareLicense


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
