.PHONY: help setup install test lint format clean run-backend run-frontend run migrations

help:
	@echo "Asset-Buddy Development Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup              - Initial project setup (creates venv, installs dependencies)"
	@echo "  make install            - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make run                - Run backend and frontend in watch mode"
	@echo "  make run-backend        - Run Django development server"
	@echo "  make run-frontend       - Run Vite development server"
	@echo ""
	@echo "Database:"
	@echo "  make migrations         - Create and run database migrations"
	@echo "  make migrate            - Run pending migrations"
	@echo "  make makemigrations     - Create new migrations"
	@echo ""
	@echo "Testing:"
	@echo "  make test               - Run all tests"
	@echo "  make test-backend       - Run backend tests with coverage"
	@echo "  make test-frontend      - Run frontend tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint               - Lint Python and JavaScript code"
	@echo "  make lint-fix           - Fix linting issues"
	@echo "  make format             - Format code with black and prettier"
	@echo "  make format-check       - Check code formatting"
	@echo "  make type-check         - Run Python type checking with mypy"
	@echo ""
	@echo "Cleaning:"
	@echo "  make clean              - Clean up cache and build files"
	@echo "  make clean-python       - Clean Python cache files"
	@echo "  make clean-node         - Clean Node modules and cache"

setup:
	@echo "Setting up development environment..."
	cd django-backend && python -m venv venv
	cd django-backend && . venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install
	@echo "✓ Setup complete"

install:
	@echo "Installing dependencies..."
	cd django-backend && . venv/bin/activate && pip install -r requirements.txt
	cd frontend && npm install

run: run-backend run-frontend

run-backend:
	@echo "Starting Django development server..."
	cd django-backend && . venv/bin/activate && python manage.py runserver

run-frontend:
	@echo "Starting Vite development server..."
	cd frontend && npm run dev

migrations:
	cd django-backend && . venv/bin/activate && python manage.py makemigrations && python manage.py migrate

migrate:
	cd django-backend && . venv/bin/activate && python manage.py migrate

makemigrations:
	cd django-backend && . venv/bin/activate && python manage.py makemigrations

test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	cd django-backend && . venv/bin/activate && pytest --cov=apps --cov-report=term-missing

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && npm run test

lint:
	@echo "Linting code..."
	cd django-backend && . venv/bin/activate && flake8 apps/ && black --check apps/ && isort --check apps/
	cd frontend && npm run lint

lint-fix:
	@echo "Fixing linting issues..."
	cd django-backend && . venv/bin/activate && black apps/ && isort apps/
	cd frontend && npm run lint:fix

format:
	@echo "Formatting code..."
	cd django-backend && . venv/bin/activate && black apps/ && isort apps/
	cd frontend && npm run format

format-check:
	@echo "Checking code formatting..."
	cd django-backend && . venv/bin/activate && black --check apps/
	cd frontend && npm run format:check

type-check:
	@echo "Type checking Python code..."
	cd django-backend && . venv/bin/activate && mypy apps/

clean: clean-python clean-node
	@echo "Cleaning up..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete

clean-python:
	@echo "Cleaning Python cache..."
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	rm -rf build/ dist/ *.egg-info

clean-node:
	@echo "Cleaning Node cache..."
	cd frontend && rm -rf node_modules dist .vite
