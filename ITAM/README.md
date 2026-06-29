# Asset-Buddy

A comprehensive asset and inventory management system for organizations to track equipment, manage assignments, monitor licenses, schedule maintenance, and generate reports.

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Development Guidelines](#development-guidelines)
- [Contributing](#contributing)

## 🎯 Overview

Asset-Buddy is a full-stack web application built with:

- **Backend**: Django REST Framework (Python)
- **Frontend**: React with Vite + TypeScript + shadcn/ui
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)

### Key Features

- Asset tracking and management
- Assignment and allocation tracking
- License management and compliance
- Location/facility management
- Maintenance scheduling
- Report generation
- User and role management
- Real-time notifications

## 📁 Project Structure

```
asset-buddy/
├── django-backend/          # REST API backend
│   ├── apps/               # Django apps (assets, users, licenses, etc.)
│   ├── config/             # Django configuration
│   ├── manage.py           # Django CLI
│   ├── requirements.txt    # Python dependencies
│   └── db.sqlite3          # Local database (SQLite)
├── frontend/               # React web application
│   ├── src/               # React components and pages
│   ├── public/            # Static assets
│   ├── package.json       # Node dependencies
│   └── dist/              # Built frontend (production)
├── README.md              # This file
├── .gitignore            # Git ignore rules
└── .env.example          # Environment template
```

## 📦 Prerequisites

- **Python 3.10+**
- **Node.js 18+** (with npm or yarn)
- **PostgreSQL 14+** (optional, SQLite for development)
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd asset-buddy
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd django-backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your settings
```

**Example `.env`:**

```env
# Django
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database (SQLite for development)
USE_SQLITE=true

# Or PostgreSQL
# POSTGRES_DB=asset_buddy
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=your-password
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432

# JWT Settings
JWT_SECRET_KEY=your-jwt-secret
```

#### Run Migrations

```bash
python manage.py migrate
```

#### Create Superuser

```bash
python manage.py createsuperuser
```

#### Start Backend Server

```bash
python manage.py runserver
```

Backend will be available at: `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd frontend
npm install
```

#### Create Environment Variables

```bash
# Create .env file
cp .env.example .env  # if available

# Or create manually
touch .env.local
```

**Example `.env.local`:**

```env
VITE_API_URL=http://localhost:8000
```

#### Start Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## ⚙️ Configuration

### Backend Configuration (`django-backend/config/settings.py`)

Key settings are environment-based:

- **DEBUG**: Set to `False` in production
- **SECRET_KEY**: Must be unique and secure
- **ALLOWED_HOSTS**: Configure for your domain
- **CORS_ALLOWED_ORIGINS**: Frontend URL
- **DATABASE**: PostgreSQL or SQLite

### JWT Authentication

Configure JWT token expiration in `.env`:

```env
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=5
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

## 🏃 Running the Application

### Development Mode

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

Visit: `http://localhost:5173`

### Production Build

**Frontend:**

```bash
npm run build
# Output: dist/
```

## 🧪 Testing

### Backend Tests

```bash
cd django-backend

# Run all tests
pytest

# Run with coverage
pytest --cov=apps

# Run specific test
pytest apps/assets/tests.py -v
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm run test

# Watch mode
npm run test:watch
```

## 📖 API Documentation

### Interactive API Docs

Once backend is running, visit:

- **Swagger UI**: `http://localhost:8000/api/docs/swagger/`
- **ReDoc**: `http://localhost:8000/api/docs/redoc/`
- **Schema**: `http://localhost:8000/api/schema/`

### API Endpoints Overview

| Module | Endpoints |
|--------|-----------|
| Users | `/api/users/`, `/api/users/{id}/` |
| Assets | `/api/assets/`, `/api/assets/{id}/` |
| Licenses | `/api/licenses/`, `/api/licenses/{id}/` |
| Locations | `/api/locations/`, `/api/locations/{id}/` |
| Assignments | `/api/assignments/`, `/api/assignments/{id}/` |
| Maintenance | `/api/maintenance/`, `/api/maintenance/{id}/` |
| Notifications | `/api/notifications/`, `/api/notifications/{id}/` |
| Reports | `/api/reports/`, `/api/reports/{id}/` |

## 👨‍💻 Development Guidelines

### Code Style

**Python Backend:**

```bash
# Format code
black django-backend/

# Sort imports
isort django-backend/

# Lint code
flake8 django-backend/
pylint django-backend/apps/
```

**Frontend:**

```bash
# Format code
npm run prettier

# Lint code
npm run lint
```

### Pre-commit Hooks

Setup automatic code quality checks:

```bash
# Install pre-commit
pip install pre-commit

# Install git hooks
pre-commit install

# Run on all files
pre-commit run --all-files
```

### Type Checking

**Python:**

```bash
# Type check Python code
mypy django-backend/apps/
```

### Commit Guidelines

Follow conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
test: add or update tests
refactor: refactor code
style: formatting changes
chore: dependency updates
```

## 🐛 Troubleshooting

### Database Errors

```bash
# Reset database
rm db.sqlite3
python manage.py migrate
```

### Port Already in Use

```bash
# Change port for Django
python manage.py runserver 8001

# Change port for Vite
npm run dev -- --port 5174
```

### CORS Errors

Ensure frontend URL is in `DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` in backend settings.

## 📝 License

[Add your license here]

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "feat: add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Last Updated**: December 2024
