"""Tests for the users app."""

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

User = get_user_model()


@pytest.mark.django_db
class TestUserModel:
    """Tests for User model."""

    def test_create_user(self):
        """Test creating a user."""
        user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active is True

    def test_create_superuser(self):
        """Test creating a superuser."""
        user = User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="admin123",
        )
        assert user.is_staff is True
        assert user.is_superuser is True


class TestUserAPI(APITestCase):
    """Tests for User API endpoints."""

    def setUp(self):
        """Set up test case."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )
        self.client.force_authenticate(user=self.user)

    def test_list_users(self):
        """Test listing users."""
        response = self.client.get("/api/users/")
        assert response.status_code == status.HTTP_200_OK
        assert "results" in response.data

    def test_retrieve_user(self):
        """Test retrieving a user."""
        response = self.client.get(f"/api/users/{self.user.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == "testuser"

    def test_create_user_unauthorized(self):
        """Test creating a user without authentication."""
        client = APIClient()
        response = client.post(
            "/api/users/",
            {
                "username": "newuser",
                "email": "new@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_user_profile(self):
        """Test updating user profile."""
        response = self.client.patch(
            f"/api/users/{self.user.id}/",
            {"email": "newemail@example.com"},
        )
        assert response.status_code == status.HTTP_200_OK
        self.user.refresh_from_db()
        assert self.user.email == "newemail@example.com"
