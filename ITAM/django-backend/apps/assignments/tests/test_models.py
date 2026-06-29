# Tests for Assignment model and constraints
# Place this in: apps/assignments/tests/test_models.py

import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from apps.assets.models import Asset
from apps.assignments.models import Assignment
from apps.core.constants import AssetStatus
from apps.manufacturers.models import Manufacturer
from apps.locations.models import Location


User = get_user_model()


class AssignmentConstraintTests(TestCase):
    """Test that only one active assignment per asset is enforced."""
    
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
        
        # Create users
        cls.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123'
        )
        cls.user1 = User.objects.create_user(
            email='user1@test.com',
            password='testpass123'
        )
        cls.user2 = User.objects.create_user(
            email='user2@test.com',
            password='testpass123'
        )
        
        # Create asset
        cls.asset = Asset.objects.create(
            name='Laptop',
            tag='TAG001',
            serial_number='SN001',
            category='laptop',
            manufacturer=cls.manufacturer,
            location=cls.location,
            created_by=cls.admin,
        )
    
    def test_only_one_active_assignment_per_asset(self):
        """Test that only one active assignment can exist per asset."""
        # Create first assignment
        assignment1 = Assignment.objects.create(
            asset=self.asset,
            assigner=self.admin,
            assigned_to_name='User One',
            employee_id='EMP001',
            location='Office',
            status=AssetStatus.ASSIGNED,
        )
        
        # Try to create second active assignment - should fail validation
        with self.assertRaises(ValidationError):
            Assignment.objects.create(
                asset=self.asset,
                assigner=self.admin,
                assigned_to_name='User Two',
                employee_id='EMP002',
                location='Office',
                status=AssetStatus.ASSIGNED,  # This violates the constraint
            )
    
    def test_can_have_returned_assignment_with_new_active(self):
        """Test that returned assignments don't block new active ones."""
        # Create and return first assignment
        assignment1 = Assignment.objects.create(
            asset=self.asset,
            assigner=self.admin,
            assigned_to_name='User One',
            employee_id='EMP001',
            location='Office',
            status=AssetStatus.ASSIGNED,
        )
        
        # Return the assignment
        assignment1.return_asset(condition='good', returned_by=self.admin)
        
        # Now can create new active assignment
        assignment2 = Assignment.objects.create(
            asset=self.asset,
            assigner=self.admin,
            assigned_to_name='User Two',
            employee_id='EMP002',
            location='Office',
            status=AssetStatus.ASSIGNED,
        )
        
        self.assertIsNotNone(assignment2.pk)
        self.assertNotEqual(assignment1.pk, assignment2.pk)
    
    def test_assignment_validates_asset_availability(self):
        """Test that assignment validates asset is available."""
        # Put asset in a state where it can't be assigned
        self.asset.status = AssetStatus.RETIRED
        self.asset.save()
        
        # Try to create assignment - should fail
        assignment = Assignment(
            asset=self.asset,
            assigner=self.admin,
            assigned_to_name='User One',
            employee_id='EMP001',
            location='Office',
            status=AssetStatus.ASSIGNED,
        )
        
        with self.assertRaises(ValidationError):
            assignment.full_clean()
    
    def test_assignment_auto_updates_asset_status(self):
        """Test that creating an assignment updates the asset status."""
        # Asset should start as AVAILABLE
        self.assertEqual(self.asset.status, AssetStatus.AVAILABLE)
        
        # Create assignment
        assignment = Assignment.objects.create(
            asset=self.asset,
            assigner=self.admin,
            assigned_to_name='User One',
            employee_id='EMP001',
            location='Office',
            status=AssetStatus.ASSIGNED,
        )
        
        # Asset status should now be ASSIGNED
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, AssetStatus.ASSIGNED)


class AssignmentLifecycleTests(TestCase):
    """Test assignment lifecycle and operations."""
    
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
        
        # Create users
        cls.admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123'
        )
        
        # Create asset
        cls.asset = Asset.objects.create(
            name='Laptop',
            tag='TAG001',
            serial_number='SN001',
            category='laptop',
            manufacturer=cls.manufacturer,
            location=cls.location,
            created_by=cls.admin,
        )
        
        # Create assignment
        cls.assignment = Assignment.objects.create(
            asset=cls.asset,
            assigner=cls.admin,
            assigned_to_name='John Doe',
            employee_id='EMP001',
            location='Office A',
            status=AssetStatus.ASSIGNED,
        )
    
    def test_return_asset_method(self):
        """Test the return_asset method."""
        self.assertEqual(self.assignment.status, AssetStatus.ASSIGNED)
        self.assertIsNone(self.assignment.actual_return_date)
        
        # Return the asset
        self.assignment.return_asset(condition='good', returned_by=self.admin)
        
        # Check status was updated
        self.assertEqual(self.assignment.status, AssetStatus.RETURNED)
        self.assertIsNotNone(self.assignment.actual_return_date)
        self.assertEqual(self.assignment.condition_on_return, 'good')
        
        # Check asset status was updated
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.status, AssetStatus.RETURNED)
    
    def test_cannot_return_already_returned_assignment(self):
        """Test that already returned assets cannot be returned again."""
        # Return the assignment
        self.assignment.return_asset(condition='good', returned_by=self.admin)
        
        # Try to return again - should fail
        with self.assertRaises(ValidationError):
            self.assignment.return_asset(condition='good', returned_by=self.admin)
