# 📖 Start Here

Welcome to Asset-Buddy! This file guides you to the most important resources.

## 🚀 First-Time Setup (5-10 minutes)

**Start with this:**
1. Read: `QUICK_START.md` (2 min)
2. Run: `setup-dev.bat` or `bash setup-dev.sh` (3 min)
3. Configure: Edit `django-backend/.env` (2 min)
4. Start: `make run` (2 min)

**Done!** Your dev environment is ready. 🎉

---

## 📚 Documentation Files (By Purpose)

### Getting Started
- **`QUICK_START.md`** ← **START HERE** (Quick reference)
- **`README.md`** ← Full setup guide
- **`SETUP_SUMMARY.md`** ← What we set up

### Development
- **`CONTRIBUTING.md`** ← Before your first commit
- **`TESTING.md`** ← How to write and run tests
- **`ARCHITECTURE.md`** ← Understanding the system

### Reference
- **`IMPLEMENTATION_REPORT.md`** ← What was implemented
- **`Makefile`** ← Common commands

---

## ⚡ Essential Commands

```bash
# Setup (run once)
setup-dev.bat                    # Windows
bash setup-dev.sh                # Linux/macOS

# Development
make run                          # Start everything
make run-backend                  # Just backend
make run-frontend                 # Just frontend

# Code Quality
make lint-fix                     # Fix linting issues
make format                       # Format code
make type-check                   # Type checking

# Testing
make test                         # Run all tests
make test-backend                 # Backend only
make test-frontend                # Frontend only

# Database
make migrate                      # Run migrations
make makemigrations               # Create migrations

# Cleaning
make clean                        # Clean cache
```

---

## 🎯 Your First Task

### 1. Setup Environment
```bash
# Windows
setup-dev.bat

# Linux/macOS
bash setup-dev.sh
```

### 2. Configure Settings
```bash
# Edit backend config
nano django-backend/.env

# Required settings:
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
```

### 3. Start Development
```bash
# Terminal 1: Backend
cd django-backend
source venv/bin/activate      # or venv\Scripts\activate on Windows
python manage.py runserver

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### 4. Open in Browser
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/api/docs/swagger/

---

## 🤔 Common Questions

### Q: Where do I start writing code?

**A:** Check the project structure in `README.md`:
- Backend: `django-backend/apps/`
- Frontend: `frontend/src/`

### Q: How do I write tests?

**A:** See `TESTING.md` with examples for:
- Models, API endpoints, permissions
- React components, hooks
- Best practices

### Q: What coding style should I use?

**A:** Read `CONTRIBUTING.md`:
- Python: Black, isort, mypy
- TypeScript: Prettier, ESLint
- Git commits: Conventional format

### Q: How do I commit code?

**A:** Follow conventional commits:
```bash
git commit -m "feat(auth): add login"
git commit -m "fix(users): resolve error"
git commit -m "test(assets): add tests"
```

### Q: Where's the API documentation?

**A:** Visit: http://localhost:8000/api/docs/swagger/

Or read the API specs in your IDE with the OpenAPI schema.

---

## 📋 Pre-Commit Checklist

Before pushing code:

- [ ] Tests pass: `make test`
- [ ] Code is formatted: `make format`
- [ ] Linting passes: `make lint-fix`
- [ ] Types check: `make type-check`
- [ ] No secrets in code

---

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check Python is installed
python --version

# Activate venv
cd django-backend
source venv/bin/activate  # or venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Frontend won't start
```bash
# Check Node is installed
node --version

# Install dependencies
cd frontend
npm install

# Clear cache
npm run build  # Test build

# Start dev server
npm run dev
```

### Port already in use
```bash
# Backend: use different port
python manage.py runserver 8001

# Frontend: use different port
npm run dev -- --port 5174
```

---

## 📖 Reading Order (Recommended)

### For Everyone
1. ✅ `QUICK_START.md` (2 min)
2. ✅ `README.md` (10 min)
3. ✅ Setup dev environment (10 min)

### Before First Commit
4. ✅ `CONTRIBUTING.md` (5 min)
5. ✅ `TESTING.md` (if writing tests, 10 min)

### For Deep Understanding
6. ✅ `ARCHITECTURE.md` (15 min)
7. ✅ `IMPLEMENTATION_REPORT.md` (10 min)

---

## 🎓 Learning Resources

- **Django**: https://docs.djangoproject.com/
- **React**: https://react.dev/
- **REST API**: https://www.django-rest-framework.org/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Testing**: https://docs.pytest.org/ and https://vitest.dev/

---

## ✅ You're Ready!

You now have:
- ✅ Professional development environment
- ✅ Automated code quality checks
- ✅ Comprehensive testing setup
- ✅ CI/CD pipeline
- ✅ Complete documentation
- ✅ Security best practices

**Now start coding! 🚀**

---

### Quick Links
- 🚀 Quick Start: `QUICK_START.md`
- 📖 Full Guide: `README.md`
- 🤝 Contributing: `CONTRIBUTING.md`
- 🧪 Testing: `TESTING.md`
- 🏗️ Architecture: `ARCHITECTURE.md`

---

**Happy coding! 💻**
