# Contributing to Asset-Buddy

Thank you for your interest in contributing to Asset-Buddy! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

Be respectful, inclusive, and professional in all interactions. We're committed to providing a welcoming and inspiring community.

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (optional, SQLite for development)
- Git

### Setup Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd asset-buddy
   ```

2. **Run setup script**

   **On Linux/macOS:**
   ```bash
   bash setup-dev.sh
   ```

   **On Windows:**
   ```bash
   setup-dev.bat
   ```

   Or **use Make** (if installed):
   ```bash
   make setup
   ```

3. **Configure environment variables**
   ```bash
   # Backend
   cd django-backend
   cp .env.example .env
   # Edit .env with your settings

   # Frontend
   cd ../frontend
   cp .env.example .env.local
   # Edit .env.local if needed
   ```

4. **Install pre-commit hooks**
   ```bash
   pip install pre-commit
   pre-commit install
   ```

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/documentation-update
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd django-backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Making Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add tests for new features
- Update documentation as needed

### Testing Your Changes

**Backend:**
```bash
cd django-backend
pytest
# or
make test-backend
```

**Frontend:**
```bash
cd frontend
npm run test
# or
npm run test:watch
```

### Code Quality Checks

Before committing, run:

```bash
# Lint and format
make lint-fix
make format

# Type checking
make type-check

# Or run individual commands
cd django-backend
black apps/
isort apps/
flake8 apps/
mypy apps/

cd ../frontend
npm run lint:fix
npm run format
```

## Coding Standards

### Python (Django Backend)

- **Style Guide**: PEP 8
- **Formatter**: Black (line length: 100)
- **Import Sorter**: isort
- **Linter**: Flake8
- **Type Hints**: Use type hints where possible

Example:
```python
from typing import Optional
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Asset(models.Model):
	"""Model representing an IT asset."""

	name: str = models.CharField(max_length=255)
	description: Optional[str] = models.TextField(blank=True, null=True)
	owner = models.ForeignKey(User, on_delete=models.CASCADE)

	def __str__(self) -> str:
		return self.name

	def get_status_display(self) -> str:
		"""Get human-readable status."""
		return dict(self.STATUS_CHOICES).get(self.status, "Unknown")
```

### JavaScript/TypeScript (React Frontend)

- **Style Guide**: Airbnb with TypeScript support
- **Formatter**: Prettier (line length: 100)
- **Linter**: ESLint
- **Language**: TypeScript (use `tsx` extensions)

Example:
```typescript
import React, { FC, useState } from 'react';
import { Button } from '@/components/ui/button';

interface AssetCardProps {
  assetId: string;
  title: string;
  onEdit: (id: string) => void;
}

const AssetCard: FC<AssetCardProps> = ({ assetId, title, onEdit }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
	setIsLoading(true);
	try {
	  onEdit(assetId);
	} finally {
	  setIsLoading(false);
	}
  };

  return (
	<div className="p-4 border rounded">
	  <h3>{title}</h3>
	  <Button onClick={handleClick} disabled={isLoading}>
		Edit
	  </Button>
	</div>
  );
};

export default AssetCard;
```

### Documentation

- Write clear, concise docstrings
- Include examples where helpful
- Keep README updated

## Commit Guidelines

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding or updating tests
- **chore**: Changes to build process, dependencies, etc.

### Examples

```bash
git commit -m "feat(assets): add asset filtering by location"
git commit -m "fix(auth): resolve JWT token expiration issue"
git commit -m "docs: update API documentation"
git commit -m "test(users): add user creation tests"
git commit -m "refactor(licenses): simplify license renewal logic"
```

## Pull Request Process

1. **Create a Pull Request** with a clear title and description
2. **Link related issues** (e.g., "Closes #123")
3. **Ensure CI/CD passes**
   - All tests pass
   - Code quality checks pass
   - No security vulnerabilities
4. **Request review** from team members
5. **Address feedback** and update PR as needed
6. **Merge** once approved (use "Squash and merge" for feature branches)

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Added/updated tests
- [ ] All tests passing
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Added tests for new features
```

## Testing

### Backend Testing

```bash
cd django-backend

# Run all tests
pytest

# Run specific test file
pytest apps/assets/tests.py

# Run specific test class
pytest apps/assets/tests.py::AssetTestCase

# Run with coverage
pytest --cov=apps --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration
```

### Frontend Testing

```bash
cd frontend

# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Test Requirements

- **Backend**: Aim for 60%+ coverage
- **Frontend**: Aim for 50%+ coverage
- Write tests for:
  - New features
  - Bug fixes
  - Critical paths

## Questions?

- Open an issue for bugs or feature requests
- Start a discussion for general questions
- Check existing issues before creating new ones

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [PEP 8 Style Guide](https://pep8.org/)

---

Thank you for contributing to Asset-Buddy! 🚀
