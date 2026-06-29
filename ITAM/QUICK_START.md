# Quick Reference Guide

## 🚀 Get Started in 5 Minutes

### 1. Clone & Setup
```bash
# Run once to set up everything
bash setup-dev.sh              # macOS/Linux
# or
setup-dev.bat                  # Windows
```

### 2. Configure
```bash
# Edit configuration
nano django-backend/.env       # Backend
nano frontend/.env.local       # Frontend
```

### 3. Run
```bash
# Terminal 1: Backend
cd django-backend
source venv/bin/activate
python manage.py runserver

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 4. Visit
- **App**: http://localhost:5173
- **API Docs**: http://localhost:8000/api/docs/swagger/

---

## 📚 Essential Commands

### Development
```bash
make run              # Start both backend & frontend
make run-backend      # Start only backend
make run-frontend     # Start only frontend
```

### Testing
```bash
make test             # Run all tests
make test-backend     # Backend tests
make test-frontend    # Frontend tests
```

### Code Quality
```bash
make lint             # Check code
make lint-fix         # Fix issues
make format           # Format code
make type-check       # Type checking
```

### Database
```bash
make migrate          # Run migrations
make makemigrations   # Create migrations
```

### Cleanup
```bash
make clean            # Clean cache files
```

---

## 🔧 Common Issues

### "Port already in use"
```bash
python manage.py runserver 8001
npm run dev -- --port 5174
```

### "Database errors"
```bash
rm db.sqlite3
python manage.py migrate
```

### "Module not found"
```bash
# Backend
pip install -r requirements.txt

# Frontend
npm install
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `README.md` | Full documentation |
| `SETUP_SUMMARY.md` | What was set up |
| `CONTRIBUTING.md` | How to contribute |
| `TESTING.md` | How to test |
| `ARCHITECTURE.md` | System design |
| `django-backend/.env` | Backend config |
| `frontend/.env.local` | Frontend config |

---

## 🧪 Test Examples

### Run Backend Tests
```bash
cd django-backend
pytest                           # All tests
pytest apps/users/              # Specific app
pytest apps/users/test_api.py   # Specific file
pytest -v                        # Verbose
pytest --cov=apps               # With coverage
```

### Run Frontend Tests
```bash
cd frontend
npm run test                 # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage
```

---

## 🔒 Before Production

- [ ] Update `.env` values
- [ ] Set `DJANGO_DEBUG=false`
- [ ] Configure database credentials
- [ ] Enable HTTPS (`SECURE_SSL_REDIRECT=true`)
- [ ] Update `ALLOWED_HOSTS`
- [ ] Run security audit: `bandit -r django-backend/apps/`
- [ ] Check for vulnerable dependencies: `pip audit && npm audit`

---

## 📞 Helpful Links

- **Django Docs**: https://docs.djangoproject.com/
- **React Docs**: https://react.dev/
- **DRF Docs**: https://www.django-rest-framework.org/
- **Git Docs**: https://git-scm.com/doc
- **Vite Docs**: https://vitejs.dev/

---

## 💡 Tips

1. **Use `make` commands** - they're faster and safer
2. **Check logs** - look in `django-backend/logs/`
3. **Read error messages** - they're helpful!
4. **Pre-commit hooks** - they run before commits
5. **Tests first** - write tests before code

---

## ✅ Checklist

After setup, verify:

- [ ] Backend runs: http://localhost:8000
- [ ] Frontend runs: http://localhost:5173
- [ ] API docs visible: http://localhost:8000/api/docs/swagger/
- [ ] `make test` passes
- [ ] `make lint` passes
- [ ] Git hooks installed: `pre-commit install`
- [ ] `.env` files created and configured
- [ ] Database migrated

---

**That's it! You're ready to code! 🎉**

For more details, see:
- `README.md` - Full setup guide
- `CONTRIBUTING.md` - Contribution guide  
- `TESTING.md` - Testing guide
- `SETUP_SUMMARY.md` - Complete summary
