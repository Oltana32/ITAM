#!/bin/bash

# Asset-Buddy Development Setup Script
# This script sets up the development environment for both backend and frontend

set -e

echo "🚀 Asset-Buddy Development Environment Setup"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Setup
echo -e "\n${BLUE}🐍 Setting up Django Backend...${NC}"

cd django-backend

# Check if venv exists
if [ ! -d "venv" ]; then
	echo "Creating virtual environment..."
	python3 -m venv venv
fi

# Activate venv
if [ -f "venv/bin/activate" ]; then
	source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
	source venv/Scripts/activate
fi

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate

# Check if .env exists
if [ ! -f ".env" ]; then
	echo "Creating .env file from template..."
	cp .env.example .env
	echo -e "${YELLOW}⚠️  Please update django-backend/.env with your settings${NC}"
fi

echo -e "${GREEN}✓ Backend setup complete${NC}"

# Frontend Setup
echo -e "\n${BLUE}⚛️  Setting up React Frontend...${NC}"

cd ../frontend

echo "Installing Node dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
	echo "Creating .env.local file from template..."
	cp .env.example .env.local
	echo -e "${YELLOW}⚠️  Frontend .env.local created with default settings${NC}"
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

# Pre-commit setup
echo -e "\n${BLUE}🔒 Setting up Pre-commit Hooks...${NC}"

cd ..

pip install pre-commit
pre-commit install

echo -e "${GREEN}✓ Pre-commit hooks installed${NC}"

# Summary
echo -e "\n${GREEN}======================================"
echo "✓ Setup Complete!"
echo "=====================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Update configuration files:"
echo "   - django-backend/.env"
echo "   - frontend/.env.local"
echo ""
echo "2. Start the backend:"
echo "   cd django-backend"
echo "   source venv/bin/activate  # or venv\\Scripts\\activate on Windows"
echo "   python manage.py runserver"
echo ""
echo "3. In another terminal, start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/api/docs/swagger/"
echo ""
