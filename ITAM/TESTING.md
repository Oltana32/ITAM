# Testing Guide for Asset-Buddy

This guide explains how to write, run, and organize tests for the Asset-Buddy project.

## Table of Contents

- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Test Organization](#test-organization)
- [Best Practices](#best-practices)
- [Coverage Reports](#coverage-reports)

## Backend Testing

### Running Tests

```bash
cd django-backend

# Run all tests
pytest

# Run specific test file
pytest apps/assets/test_models.py

# Run specific test class
pytest apps/assets/test_models.py::AssetModelTests

# Run specific test method
pytest apps/assets/test_models.py::AssetModelTests::test_create_asset

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=apps --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration
```

### Test File Structure

```
django-backend/
├── apps/
│   ├── assets/
│   │   ├── test_models.py         # Model tests
│   │   ├── test_views.py          # View/API endpoint tests
│   │   ├── test_serializers.py    # Serializer tests
│   │   ├── test_permissions.py    # Permission tests
│   │   └── fixtures.py            # Test fixtures
│   └── ...
```

### Writing Backend Tests

#### Model Tests

```python
# apps/assets/test_models.py
import pytest
from django.contrib.auth import get_user_model
from apps.assets.models import Asset

User = get_user_model()


@pytest.mark.django_db
class TestAssetModel:
	"""Tests for Asset model."""

	def test_create_asset(self):
		"""Test creating an asset."""
		user = User.objects.create_user(
			username="testuser",
			email="test@example.com",
			password="testpass123",
		)

		asset = Asset.objects.create(
			name="Laptop",
			description="MacBook Pro",
			owner=user,
		)

		assert asset.name == "Laptop"
		assert asset.owner == user

	def test_asset_str(self):
		"""Test Asset string representation."""
		user = User.objects.create_user(username="test", password="pass123")
		asset = Asset.objects.create(name="Monitor", owner=user)

		assert str(asset) == "Monitor"

	def test_asset_with_invalid_data(self):
		"""Test creating asset with invalid data."""
		user = User.objects.create_user(username="test", password="pass123")

		with pytest.raises(Exception):
			Asset.objects.create(
				name="",  # Empty name
				owner=user,
			)
```

#### API View Tests

```python
# apps/assets/test_views.py
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.assets.models import Asset

User = get_user_model()


@pytest.mark.django_db
class TestAssetAPI:
	"""Tests for Asset API endpoints."""

	@pytest.fixture
	def api_client(self):
		"""Create API client."""
		return APIClient()

	@pytest.fixture
	def authenticated_user(self, db):
		"""Create authenticated user."""
		return User.objects.create_user(
			username="testuser",
			email="test@example.com",
			password="testpass123",
		)

	@pytest.fixture
	def authenticated_client(self, api_client, authenticated_user):
		"""Create authenticated API client."""
		api_client.force_authenticate(user=authenticated_user)
		return api_client

	def test_list_assets(self, authenticated_client):
		"""Test listing assets."""
		response = authenticated_client.get("/api/assets/")
		assert response.status_code == status.HTTP_200_OK
		assert "results" in response.data

	def test_create_asset(self, authenticated_client, authenticated_user):
		"""Test creating an asset."""
		data = {
			"name": "New Laptop",
			"description": "MacBook Pro 14\"",
			"owner": authenticated_user.id,
		}
		response = authenticated_client.post("/api/assets/", data)
		assert response.status_code == status.HTTP_201_CREATED
		assert response.data["name"] == "New Laptop"

	def test_retrieve_asset(self, authenticated_client, authenticated_user):
		"""Test retrieving a single asset."""
		asset = Asset.objects.create(
			name="Laptop",
			owner=authenticated_user,
		)
		response = authenticated_client.get(f"/api/assets/{asset.id}/")
		assert response.status_code == status.HTTP_200_OK
		assert response.data["name"] == "Laptop"

	def test_update_asset(self, authenticated_client, authenticated_user):
		"""Test updating an asset."""
		asset = Asset.objects.create(
			name="Old Name",
			owner=authenticated_user,
		)
		data = {"name": "New Name"}
		response = authenticated_client.patch(f"/api/assets/{asset.id}/", data)
		assert response.status_code == status.HTTP_200_OK

		asset.refresh_from_db()
		assert asset.name == "New Name"

	def test_delete_asset(self, authenticated_client, authenticated_user):
		"""Test deleting an asset."""
		asset = Asset.objects.create(
			name="Laptop",
			owner=authenticated_user,
		)
		response = authenticated_client.delete(f"/api/assets/{asset.id}/")
		assert response.status_code == status.HTTP_204_NO_CONTENT
		assert not Asset.objects.filter(id=asset.id).exists()

	def test_unauthorized_access(self, api_client):
		"""Test accessing endpoint without authentication."""
		response = api_client.get("/api/assets/")
		assert response.status_code == status.HTTP_401_UNAUTHORIZED
```

#### Permission Tests

```python
# apps/assets/test_permissions.py
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.assets.models import Asset

User = get_user_model()


@pytest.mark.django_db
class TestAssetPermissions:
	"""Tests for Asset permissions."""

	def test_user_cannot_delete_others_asset(self):
		"""Test that users cannot delete others' assets."""
		user1 = User.objects.create_user(
			username="user1",
			password="pass123",
		)
		user2 = User.objects.create_user(
			username="user2",
			password="pass123",
		)

		asset = Asset.objects.create(
			name="User1's Asset",
			owner=user1,
		)

		client = APIClient()
		client.force_authenticate(user=user2)

		response = client.delete(f"/api/assets/{asset.id}/")
		assert response.status_code == status.HTTP_403_FORBIDDEN
```

### Test Fixtures

```python
# apps/conftest.py
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def api_client():
	"""API client fixture."""
	return APIClient()


@pytest.fixture
def user():
	"""Create a test user."""
	return User.objects.create_user(
		username="testuser",
		email="test@example.com",
		password="testpass123",
	)


@pytest.fixture
def authenticated_client(api_client, user):
	"""Create authenticated API client."""
	api_client.force_authenticate(user=user)
	return api_client
```

## Frontend Testing

### Running Tests

```bash
cd frontend

# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Writing Frontend Tests

#### Component Tests

```typescript
// src/components/AssetCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetCard } from './AssetCard';

describe('AssetCard', () => {
  it('renders asset information', () => {
	render(
	  <AssetCard
		id="1"
		name="Laptop"
		description="MacBook Pro"
		onEdit={jest.fn()}
	  />
	);

	expect(screen.getByText('Laptop')).toBeInTheDocument();
	expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
	const handleEdit = jest.fn();
	const user = userEvent.setup();

	render(
	  <AssetCard
		id="1"
		name="Laptop"
		description="MacBook Pro"
		onEdit={handleEdit}
	  />
	);

	const editButton = screen.getByRole('button', { name: /edit/i });
	await user.click(editButton);

	expect(handleEdit).toHaveBeenCalledWith('1');
  });
});
```

## Test Organization

### Test File Naming

```
# Python tests
test_models.py           # Model tests
test_views.py            # View/API endpoint tests
test_serializers.py      # Serializer tests
test_permissions.py      # Permission tests
test_services.py         # Service/utility tests

# TypeScript tests
ComponentName.test.tsx   # Component tests
hooks.test.ts            # Hook tests
utils.test.ts            # Utility function tests
```

## Best Practices

### Backend Testing

1. **Use pytest markers** for organization
   ```python
   @pytest.mark.unit
   def test_something():
	   pass

   @pytest.mark.integration
   def test_api():
	   pass
   ```

2. **Use fixtures** for reusable test data
3. **Test one thing per test** (single responsibility)
4. **Use descriptive test names**
   ```python
   # Good
   def test_create_asset_with_valid_data_succeeds():
	   pass

   # Bad
   def test_create():
	   pass
   ```

5. **Test both success and failure cases**
6. **Use pytest.raises** for exception testing
   ```python
   with pytest.raises(ValidationError):
	   asset.full_clean()
   ```

### Frontend Testing

1. **Test user interactions**, not implementation
2. **Use semantic queries**
   ```typescript
   // Good
   screen.getByRole('button', { name: /submit/i })

   // Bad
   container.querySelector('.btn-submit')
   ```

3. **Mock external dependencies**
4. **Test accessibility**
5. **Keep tests focused**

## Coverage Reports

### Generate Coverage Report

**Backend:**
```bash
cd django-backend
pytest --cov=apps --cov-report=html

# Open report
open htmlcov/index.html
```

**Frontend:**
```bash
cd frontend
npm run test:coverage

# Open report
open coverage/index.html
```

### Coverage Goals

- **Backend**: ≥60% coverage
- **Frontend**: ≥50% coverage
- Focus on critical paths and user interactions

---

For more information, see:
- [pytest documentation](https://docs.pytest.org/)
- [Vitest documentation](https://vitest.dev/)
- [Testing Library documentation](https://testing-library.com/)
