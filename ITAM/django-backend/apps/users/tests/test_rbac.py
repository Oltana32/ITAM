from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import UserRole

User = get_user_model()


class RBACPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@test.com", password="pass12345", role=UserRole.ADMIN
        )
        self.it_team = User.objects.create_user(
            email="it@test.com", password="pass12345", role=UserRole.IT_TEAM
        )
        self.finance = User.objects.create_user(
            email="finance@test.com", password="pass12345", role=UserRole.FINANCE
        )

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_finance_can_export_asset_report_csv(self):
        self._auth(self.finance)
        response = self.client.get("/api/reports/generate_asset_report/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("text/csv", response["Content-Type"])

    def test_finance_can_read_assets(self):
        self._auth(self.finance)
        response = self.client.get("/api/assets/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_finance_cannot_create_assets(self):
        self._auth(self.finance)
        response = self.client.post("/api/assets/", {"name": "Test"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_finance_cannot_list_users(self):
        self._auth(self.finance)
        response = self.client.get("/api/users/")
        self.assertIn(response.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

    def test_it_team_can_create_assets_endpoint_requires_data(self):
        self._auth(self.it_team)
        response = self.client.post("/api/assets/", {"name": "Test"}, format="json")
        self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN))

    def test_admin_can_list_users(self):
        self._auth(self.admin)
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_finance_cannot_access_notifications(self):
        self._auth(self.finance)
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
