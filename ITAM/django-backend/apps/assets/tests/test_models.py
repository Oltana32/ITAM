# Tests for Asset model and status transitions
# Place this in: apps/assets/tests/test_models.py

import pytest
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from rest_framework.test import APIClient
from apps.assets.models import Asset, AssetStatusHistory
from apps.attachments.models import Attachment
from apps.core.constants import AssetStatus
from apps.manufacturers.models import Manufacturer
from apps.locations.models import Location


User = get_user_model()


class AssetStatusTransitionTests(TestCase):
    """Test asset status transition validation."""
    
    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        # Create required related objects
        cls.manufacturer, _ = Manufacturer.objects.get_or_create(
            name='Dell',
            defaults={'support_email': 'support@dell.com'}
        )
        cls.location = Location.objects.create(
            name='Building A'
        )
        cls.user = User.objects.create_user(
            email='user@test.com',
            password='testpass123'
        )
        
        # Create an asset
        cls.asset = Asset.objects.create(
            name='Test Laptop',
            tag='TAG001',
            serial_number='SN001',
            category='laptop',
            manufacturer=cls.manufacturer,
            location=cls.location,
            created_by=cls.user,
        )
    
    def test_asset_creation_sets_default_status(self):
        """Test that new assets get AVAILABLE status by default."""
        self.assertEqual(self.asset.status, AssetStatus.AVAILABLE)
    
    def test_valid_transition_available_to_assigned(self):
        """Test valid transition from AVAILABLE to ASSIGNED."""
        self.asset.change_status(
            AssetStatus.ASSIGNED,
            changed_by=self.user,
            reason='Assigned to user'
        )
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, AssetStatus.ASSIGNED)
    
    def test_invalid_transition_raises_error(self):
        """Test that invalid transitions raise ValidationError."""
        # Set to DISPOSED (terminal state)
        Asset.objects.filter(pk=self.asset.pk).update(status=AssetStatus.DISPOSED)
        self.asset.refresh_from_db()
        
        # Try to transition to AVAILABLE (should fail)
        with self.assertRaises(ValidationError):
            self.asset.change_status(AssetStatus.AVAILABLE, changed_by=self.user)

    def test_invalid_api_transition_returns_400_message(self):
        """Invalid status updates should return a clean validation error instead of a server error."""
        self.asset.status = AssetStatus.DISPOSED
        self.asset.save()

        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.patch(
            f"/api/assets/{self.asset.id}/",
            {"status": AssetStatus.AVAILABLE},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Disposed assets cannot be changed", response.data["detail"])

    def test_asset_assigned_status_must_be_set_via_assignment_workflow(self):
        """Direct asset updates cannot mark an asset as assigned; assignment page owns that transition."""
        client = APIClient()
        client.force_authenticate(user=self.user)

        response = client.patch(
            f"/api/assets/{self.asset.id}/",
            {"status": AssetStatus.ASSIGNED},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("assignment workflow", response.data["status"][0])

    def test_status_history_created(self):
        """Test that status changes are recorded in history."""
        initial_count = self.asset.status_history.count()
        
        self.asset.change_status(
            AssetStatus.MAINTENANCE,
            changed_by=self.user,
            reason='Preventive maintenance'
        )
        
        # Check that history was created
        self.assertEqual(self.asset.status_history.count(), initial_count + 1)
        
        # Check the latest history record
        latest = self.asset.status_history.latest('changed_at')
        self.assertEqual(latest.from_status, AssetStatus.AVAILABLE)
        self.assertEqual(latest.to_status, AssetStatus.MAINTENANCE)
        self.assertEqual(latest.changed_by, self.user)
        self.assertEqual(latest.reason, 'Preventive maintenance')

    def test_delete_all_assets_endpoint_removes_all_records(self):
        """The settings data reset should delete all assets via the API."""
        Asset.objects.create(
            name='Second Laptop',
            tag='TAG002',
            serial_number='SN002',
            category='laptop',
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.user,
        )

        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.delete('/api/assets/delete-all/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(Asset.objects.count(), 0)
        self.assertEqual(response.data['deleted'], 2)
    
    def test_storage_summary_uses_real_attachment_size(self):
        """The settings data panel should show actual storage used by uploaded files."""
        Attachment.objects.create(
            asset=self.asset,
            file=ContentFile(b'12345', name='sample.txt'),
            file_name='sample.txt',
            file_size=5,
            mime_type='text/plain',
            title='Sample upload',
        )

        client = APIClient()
        client.force_authenticate(user=self.user)
        response = client.get('/api/assets/storage-summary/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['used_bytes'], 5)
        self.assertEqual(response.data['used_human'], '5 B')
        self.assertGreaterEqual(response.data['used_percent'], 0)

    def test_asset_availability_check(self):
        """Test is_available_for_assignment property."""
        # Available status should be assignable
        self.asset.status = AssetStatus.AVAILABLE
        self.assertTrue(self.asset.is_available_for_assignment)
        
        # In-use status should not be assignable
        self.asset.status = AssetStatus.IN_USE
        self.assertFalse(self.asset.is_available_for_assignment)
    
    def test_asset_active_use_check(self):
        """Test is_in_active_use property."""
        # ASSIGNED status means in active use
        self.asset.status = AssetStatus.ASSIGNED
        self.assertTrue(self.asset.is_in_active_use)
        
        # AVAILABLE status means not in active use
        self.asset.status = AssetStatus.AVAILABLE
        self.assertFalse(self.asset.is_in_active_use)

    def test_in_use_assets_cannot_be_set_back_to_available_directly(self):
        """In-use assets must be returned through assignment workflows."""
        Asset.objects.filter(pk=self.asset.pk).update(status=AssetStatus.IN_USE)
        self.asset.refresh_from_db()

        with self.assertRaises(ValidationError):
            self.asset.change_status(AssetStatus.AVAILABLE, changed_by=self.user)

    def test_terminal_statuses_default_to_poor_and_zero_value(self):
        """Retired and disposed assets should be visible and treated as low-value inventory."""
        self.asset.purchase_cost = Decimal('2500.00')
        self.asset.condition = 'good'
        self.asset.status = AssetStatus.RETIRED
        self.asset.save()

        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, AssetStatus.RETIRED)
        self.assertEqual(self.asset.condition, 'poor')
        self.assertEqual(self.asset.purchase_cost, Decimal('0.00'))

        second = Asset.objects.create(
            name='Disposed Laptop',
            tag='TAG002',
            serial_number='SN002',
            category='laptop',
            manufacturer=self.manufacturer,
            location=self.location,
            created_by=self.user,
            purchase_cost=Decimal('1800.00'),
            condition='excellent',
            status=AssetStatus.DISPOSED,
        )
        second.refresh_from_db()
        self.assertEqual(second.condition, 'poor')
        self.assertEqual(second.purchase_cost, Decimal('0.00'))

    def test_retired_and_lost_statuses_restore_value_when_recovered(self):
        """Retired and lost assets zero out value while inactive but restore on reactivation."""
        self.asset.purchase_cost = Decimal('3200.00')
        self.asset.condition = 'good'
        self.asset.save()

        self.asset.status = AssetStatus.RETIRED
        self.asset.save()
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.purchase_cost, Decimal('0.00'))

        self.asset.status = AssetStatus.AVAILABLE
        self.asset.save()
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.purchase_cost, Decimal('3200.00'))

        self.asset.status = AssetStatus.LOST
        self.asset.save()
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.purchase_cost, Decimal('0.00'))

        self.asset.status = AssetStatus.AVAILABLE
        self.asset.save()
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.purchase_cost, Decimal('3200.00'))
