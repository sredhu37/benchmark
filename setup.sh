#!/bin/bash

# Setup script for local development
set -e

echo "🚀 Setting up Performance Benchmark Tool..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi
echo "✅ Node.js $(node -v)"

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm $(npm -v)"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop"
    exit 1
fi
echo "✅ Docker $(docker -v)"

echo ""
echo "📦 Installing dependencies..."

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
npm install
cd ..
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Create .env files if they don't exist
echo ""
echo "⚙️  Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env${NC}"
else
    echo "ℹ️  backend/.env already exists"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
else
    echo "ℹ️  frontend/.env already exists"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📚 Next steps:"
echo ""
echo "  1. Start the application:"
echo -e "     ${YELLOW}docker-compose up --build${NC}"
echo ""
echo "  2. Access the application:"
echo -e "     Frontend: ${YELLOW}http://localhost:3000${NC}"
echo -e "     Backend:  ${YELLOW}http://localhost:5000${NC}"
echo ""
echo "  3. Run tests:"
echo -e "     Backend:  ${YELLOW}cd backend && npm test${NC}"
echo -e "     Frontend: ${YELLOW}cd frontend && npm test${NC}"
echo ""
echo "  4. View detailed documentation:"
echo -e "     ${YELLOW}cat AGENTS.md${NC}"
echo ""
echo "Happy benchmarking! 🎯"
