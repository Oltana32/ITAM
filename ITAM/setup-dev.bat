@echo off
REM Asset-Buddy Development Setup Script (Windows)

echo.
echo 🚀 Asset-Buddy Development Environment Setup
echo ============================================== 
echo.

REM Backend Setup
echo 🐍 Setting up Django Backend...
echo.

cd django-backend

REM Check if venv exists
if not exist "venv" (
	echo Creating virtual environment...
	python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

echo Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

echo Running migrations...
python manage.py migrate

REM Check if .env exists
if not exist ".env" (
	echo Creating .env file from template...
	copy .env.example .env
	echo ⚠️  Please update django-backend\.env with your settings
)

echo ✓ Backend setup complete
echo.

REM Frontend Setup
echo ⚛️  Setting up React Frontend...
echo.

cd ..\frontend

echo Installing Node dependencies...
call npm install

REM Check if .env.local exists
if not exist ".env.local" (
	echo Creating .env.local file from template...
	copy .env.example .env.local
	echo ⚠️  Frontend .env.local created with default settings
)

echo ✓ Frontend setup complete
echo.

REM Pre-commit setup
echo 🔒 Setting up Pre-commit Hooks...
echo.

cd ..

pip install pre-commit
pre-commit install

echo ✓ Pre-commit hooks installed
echo.

REM Summary
echo ======================================
echo ✓ Setup Complete!
echo ======================================
echo.
echo Next steps:
echo.
echo 1. Update configuration files:
echo    - django-backend\.env
echo    - frontend\.env.local
echo.
echo 2. Start the backend:
echo    cd django-backend
echo    venv\Scripts\activate
echo    python manage.py runserver
echo.
echo 3. In another terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Access the application:
echo    Frontend: http://localhost:5173
echo    Backend API: http://localhost:8000
echo    API Docs: http://localhost:8000/api/docs/swagger/
echo.
pause
