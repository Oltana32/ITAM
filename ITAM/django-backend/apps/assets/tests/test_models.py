# Tests for Asset model and status transitions
# Place this in: apps/assets/tests/test_models.py

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from apps.assets.models import Asset, AssetStatusHistory
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
