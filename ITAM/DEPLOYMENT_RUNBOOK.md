# Enterprise Production Deployment Runbook

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL and Redis managed services available
- TLS certificate for production domain
- Production secret values generated securely

## 1. Prepare production environment

1. Copy the example environment file:
   - `cp django-backend/.env.production.example django-backend/.env.production`
2. Replace placeholder values with real secrets and domain names.
3. Set `DJANGO_SECRET_KEY` to a high-entropy random value.
4. Configure `POSTGRES_PASSWORD` and `CORS_ALLOWED_ORIGINS` to match the deployment environment.

## 2. Build and validate

```bash
cd django-backend
python healthcheck.py
python manage.py migrate
python manage.py check --deploy
```

## 3. Run with Docker Compose

```bash
docker compose up --build -d
```

## 4. Verify service health

- Backend: `http://localhost:8000/healthz/`
- Readiness: `http://localhost:8000/readyz/`
- Frontend: `http://localhost/`

## 5. Production deployment checklist

- TLS enabled and redirect enforced
- HSTS enabled with appropriate duration
- Secure cookies enabled
- CSRF trusted origins configured
a- Health checks enabled
- Database and Redis health checks enabled
- Logs shipped to centralized monitoring
- Backups scheduled and tested
- Deployment performed through CI/CD pipeline

## 6. Rollback plan

1. Restore previous image/tag.
2. Revert the application config.
3. Re-run the database migration rollback if required.
4. Validate `/healthz/` and `/readyz/` before traffic is restored.
