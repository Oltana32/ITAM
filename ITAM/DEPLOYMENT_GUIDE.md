# ITAM System Modernization - Migration & Deployment Guide

## Quick Start

This guide walks through deploying the ITAM system modernization in development and production environments.

## Pre-Deployment Checklist

### Development Environment
```bash
cd django-backend

# 1. Install any new dependencies
pip install --upgrade -r requirements.txt

# 2. Create migrations for new models
python manage.py makemigrations

# 3. Review migration files
git diff db/migrations/

# 4. Run migrations locally
python manage.py migrate

# 5. Test new features
python manage.py test

# 6. Run Django checks
python manage.py check
```

### Production Environment
```bash
# 1. Backup database FIRST
pg_dump itam_production > itam_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup integrity
pg_restore -d itam_test itam_backup_*.sql

# 3. Update code (git pull or deployment process)
git pull origin main

# 4. Install dependencies in virtualenv
source venv/bin/activate
pip install -r requirements.txt

# 5. Collect static files
python manage.py collectstatic --noinput

# 6. Run migrations
python manage.py migrate

# 7. Verify system
python manage.py check --deploy

# 8. Restart application server
systemctl restart gunicorn  # or your app server
```

## Major Changes Summary

### New Apps Added
```python
INSTALLED_APPS += [
    'apps.attachments',  # File management
    'apps.audits',       # Asset audit system
]
```

### Database Schema Changes

#### New Tables Created:
1. `attachments_attachment` - File storage with versioning
2. `attachments_attachmentaccess` - Audit trail for downloads
3. `audits_auditsession` - Audit session management
4. `audits_auditfinding` - Individual asset findings
5. `audits_variancereport` - Variance analysis

#### Existing Tables Modified:
1. `assets_asset` - Added depreciation fields:
   - `useful_life_years` (PositiveIntegerField, nullable)
   - `residual_value` (DecimalField, nullable)
   - `depreciation_method` (CharField, default='straight_line')

2. `users_user` - Role choices expanded (backward compatible)

### New API Endpoints

```
FILE MANAGEMENT
POST   /api/attachments/              Create attachment
GET    /api/attachments/              List attachments
GET    /api/attachments/{id}/         Get details
PUT    /api/attachments/{id}/         Update
DELETE /api/attachments/{id}/         Delete
GET    /api/attachments/{id}/download/           Download file
GET    /api/attachments/{id}/access_history/     View access log
POST   /api/attachments/{id}/replace/            Replace version
GET    /api/attachment-access/                   List access logs (admin)

AUDIT MANAGEMENT
POST   /api/audit-sessions/           Create audit
GET    /api/audit-sessions/           List audits
GET    /api/audit-sessions/{id}/      Get details
PUT    /api/audit-sessions/{id}/      Update
DELETE /api/audit-sessions/{id}/      Delete
POST   /api/audit-sessions/{id}/start/           Start audit
POST   /api/audit-sessions/{id}/complete/        Complete audit
GET    /api/audit-sessions/{id}/variance_report/ Get report
POST   /api/audit-findings/           Record finding
GET    /api/audit-findings/           List findings
GET    /api/audit-findings/{id}/      Get finding
PUT    /api/audit-findings/{id}/      Update
DELETE /api/audit-findings/{id}/      Delete
```

## Step-by-Step Deployment

### Phase 1: Testing (Dev Environment)

```bash
# 1. Create test database
createdb itam_test

# 2. Run migrations
python manage.py migrate --database=test

# 3. Create test audit session
python manage.py shell

from apps.audits.models import AuditSession
from apps.users.models import User
from datetime import date

user = User.objects.first()
session = AuditSession.objects.create(
    title="Test Audit",
    planned_date=date.today(),
    created_by=user,
    status="planned"
)
print(f"Created audit: {session}")

# 4. Run tests
python manage.py test apps.audits
python manage.py test apps.attachments
python manage.py test apps.assets

# 5. Verify API
curl http://localhost:8000/api/audit-sessions/
curl http://localhost:8000/api/attachments/
```

### Phase 2: Staging Environment

```bash
# 1. Deploy code to staging
# ... your deployment process ...

# 2. Run migrations
python manage.py migrate

# 3. Create initial audit session for testing
python manage.py shell < scripts/seed_audit_data.py

# 4. Test file uploads
# Test via UI or:
curl -X POST http://staging/api/attachments/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "title=Test Document" \
  -F "file_type=invoice" \
  -F "asset=1"

# 5. Verify database integrity
python manage.py check
python manage.py check --deploy

# 6. Monitor logs
tail -f /var/log/gunicorn/error.log
```

### Phase 3: Production Deployment

```bash
# 1. Backup database
pg_dump -h db.example.com itam_prod > backup_$(date +%Y%m%d).sql

# 2. Verify backup
file backup_*.sql
du -h backup_*.sql

# 3. Deploy code (blue-green recommended)
# ... your CI/CD pipeline ...

# 4. Run migrations (in maintenance window if possible)
python manage.py migrate

# 5. Verify deployment
python manage.py check --deploy

# 6. Monitor application
# Watch logs for errors
# Monitor database for slow queries
# Check disk space for file uploads

# 7. Smoke tests
curl https://api.example.com/api/audit-sessions/ \
  -H "Authorization: Bearer $PROD_TOKEN"

curl https://api.example.com/api/assets/ \
  -H "Authorization: Bearer $PROD_TOKEN" \
  | jq '.results[0].depreciation'  # Check deprecation field exists
```

## Feature Enablement

### Asset Tag Automation
- ✅ Enabled by default
- Tags auto-generated on asset creation
- No action needed - existing API changes transparent

### Depreciation Calculations
- ✅ Enabled for all assets
- Optional fields (`useful_life_years`, `residual_value`)
- Depreciation data in API responses (may be null for old assets)
- No breaking changes

### File Attachments
- ✅ Available via new `/api/attachments/` endpoint
- Requires `IsAssetManager` permission
- Upload directory created automatically
- Configure max file size in settings

### Asset Audits
- ✅ Available via new `/api/audit-sessions/` endpoint
- Requires `IsAuditor` permission
- Create sessions via API or Django admin
- Audit findings linked to assets

### RBAC Expansion
- ✅ New roles available immediately
- Old roles still functional (backward compatible)
- Update users incrementally
- No forced migration needed

## Configuration

### File Upload Settings (settings.py)

```python
# Max upload size (default: 100MB)
DATA_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024  # 100MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 100 * 1024 * 1024

# File storage location
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
MEDIA_URL = '/media/'

# Allowed file types
ALLOWED_ATTACHMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
]

# Depreciation defaults
DEPRECIATION_DEFAULT_METHOD = 'straight_line'  # or 'declining'
DEPRECIATION_DEFAULT_USEFUL_LIFE = 5  # years
```

### Database Connection Pool (Production)

```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.environ.get('DB_HOST'),
        'PORT': 5432,
        'CONN_MAX_AGE': 600,
        # Use pgbouncer or similar for connection pooling
    }
}
```

## Rollback Plan

### If Issues Occur

```bash
# 1. Quick rollback (code only)
git revert HEAD
systemctl restart gunicorn

# 2. Database rollback (if migrations failed)
# Django stores migration history, so reverse is possible:
python manage.py migrate apps.audits 0001  # go back to first migration
python manage.py migrate apps.attachments 0001

# 3. Full rollback (nuclear option)
# Restore from backup
psql itam_prod < backup_$(date +%Y%m%d).sql

# 4. Check logs
tail -100 /var/log/gunicorn/error.log
```

## Verification Scripts

### Post-Deployment Verification

```bash
#!/bin/bash
# verify_deployment.sh

API_URL="https://api.example.com"
TOKEN="your_bearer_token"

echo "Verifying ITAM Deployment..."

# 1. Check database connectivity
python manage.py dbshell <<< "SELECT 1"
echo "✓ Database connected"

# 2. Check new tables exist
python manage.py sqlmigrate apps.attachments 0001 | grep "CREATE TABLE"
python manage.py sqlmigrate apps.audits 0001 | grep "CREATE TABLE"
echo "✓ New tables exist"

# 3. Test asset depreciation endpoint
curl -s "$API_URL/api/assets/?format=json" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.results[0] | has("depreciation")'
echo "✓ Asset depreciation field present"

# 4. Test attachment endpoint
curl -s "$API_URL/api/attachments/?format=json" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.count'
echo "✓ Attachment endpoint accessible"

# 5. Test audit endpoint
curl -s "$API_URL/api/audit-sessions/?format=json" \
  -H "Authorization: Bearer $TOKEN" | \
  jq '.count'
echo "✓ Audit endpoint accessible"

echo ""
echo "✓ All checks passed!"
```

## Performance Testing

### Load Testing for New Features

```bash
# Test file upload performance
ab -n 100 -c 10 -p file.json \
  -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/attachments/

# Test audit session queries
ab -n 1000 -c 50 \
  -H "Authorization: Bearer $TOKEN" \
  https://api.example.com/api/audit-sessions/

# Monitor database during tests
watch -n 1 'psql -c "SELECT * FROM pg_stat_user_tables ORDER BY seq_scan DESC LIMIT 10;"'
```

## Monitoring & Support

### Key Metrics to Monitor

```
- New attachments created per day
- File upload failures
- Audit session completion rate
- Depreciation calculation time (should be <50ms)
- Database table sizes (especially attachments)
```

### Common Troubleshooting

**Problem:** Tag generation slow
- Check database indexes: `SELECT * FROM pg_stat_user_indexes WHERE relname = 'assets_asset';`
- Verify select_for_update working
- Check PostgreSQL logs

**Problem:** File uploads timing out
- Increase timeout: `FILE_UPLOAD_TIMEOUT = 300`
- Check file storage permissions
- Verify disk space available

**Problem:** Audit variance report not generating
- Verify audit status is COMPLETED
- Check all findings recorded
- Review application logs

### Support Contact

For issues or questions:
- Document your issue with reproduction steps
- Include Django settings (sanitized)
- Provide error logs and stack traces
- Check `/api/docs/` for API documentation

---

## Post-Deployment Tasks

- [ ] Update user documentation
- [ ] Train users on new features
- [ ] Monitor system performance
- [ ] Check error logs daily for 1 week
- [ ] Gather user feedback
- [ ] Plan follow-up enhancements

---

**Deployment Guide Complete**
