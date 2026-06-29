"""Base test configuration and utilities for the project."""

import pytest
from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    """Fixture for API client."""
    return APIClient()


@pytest.fixture
def authenticated_user(db):
    """Fixture for creating an authenticated test user."""
    user = User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
    )
    return user


@pytest.fixture
def authenticated_api_client(db, authenticated_user):
    """Fixture for API client with authenticated user."""
    client = APIClient()
    client.force_authenticate(user=authenticated_user)
    return client


class BaseAPITestCase(APITestCase):
    """Base class for API tests with common utilities."""

    @classmethod
    def setUpClass(cls):
        """Set up test class."""
        super().setUpClass()

    def setUp(self):
        """Set up test case."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(user=self.user)

    def assert_response_status(self, response, expected_status):
        """Assert response status code."""
        self.assertEqual(
            response.status_code,
            expected_status,
            msg=f"Expected {expected_status}, got {response.status_code}: {response.data}",
        )

    def assert_api_list_response(self, response, expected_count=None):
        """Assert response is a valid list response."""
        self.assertIn("results", response.data)
        if expected_count is not None:
            self.assertEqual(len(response.data["results"]), expected_count)
