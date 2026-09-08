"""Tests for the users app."""

import io

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
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

    def test_user_can_update_profile_with_avatar(self):
        """Users can update their own profile details and upload an avatar."""
        image_bytes = io.BytesIO()
        Image.new("RGB", (1, 1), color="white").save(image_bytes, format="PNG")
        avatar = SimpleUploadedFile("avatar.png", image_bytes.getvalue(), content_type="image/png")

        response = self.client.patch(
            "/api/users/me/",
            {
                "first_name": "Updated",
                "last_name": "User",
                "department": "Operations",
                "avatar": avatar,
            },
            format="multipart",
        )

        assert response.status_code == status.HTTP_200_OK
        self.user.refresh_from_db()
        assert self.user.first_name == "Updated"
        assert self.user.last_name == "User"
        assert self.user.department == "Operations"
        assert self.user.avatar.name

    def test_admin_can_delete_user(self):
        """Admins can remove user accounts."""
        admin = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="adminpass123",
            role="admin",
        )
        self.client.force_authenticate(user=admin)

        response = self.client.delete(f"/api/users/{self.user.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not User.objects.filter(pk=self.user.pk).exists()

    def test_force_password_change_requires_new_password_and_confirmation(self):
        """A first-time login should require a new password and confirmation."""
        self.user.must_change_password = True
        self.user.save(update_fields=["must_change_password"])

        response = self.client.post(
            "/api/users/change_password/",
            {
                "new_password": "NewPass123!",
                "confirm_password": "NewPass123!",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        self.user.refresh_from_db()
        assert self.user.check_password("NewPass123!")
        assert self.user.must_change_password is False
