import pytest
from django.test import Client


@pytest.mark.django_db
class TestHealthEndpoints:
    def test_healthz_endpoint_returns_ok(self):
        client = Client()

        response = client.get("/healthz/")

        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    def test_readyz_endpoint_returns_ok(self):
        client = Client()

        response = client.get("/readyz/")

        assert response.status_code == 200
        assert response.json()["status"] == "ok"
