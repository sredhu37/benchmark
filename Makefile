# Makefile for benchmark application

.PHONY: help setup install build test lint clean dev up down logs deploy

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Run initial setup
	@chmod +x setup.sh
	@./setup.sh

install: ## Install all dependencies
	@echo "Installing backend dependencies..."
	@cd backend && npm install
	@echo "Installing frontend dependencies..."
	@cd frontend && npm install

build: ## Build Docker images
	@echo "Building Docker images..."
	@docker-compose build

test: ## Run all tests
	@echo "Running backend tests..."
	@cd backend && npm test
	@echo "Running frontend tests..."
	@cd frontend && npm test

lint: ## Run linters
	@echo "Linting backend..."
	@cd backend && npm run lint
	@echo "Linting frontend..."
	@cd frontend && npm run lint

lint-fix: ## Fix linting issues
	@echo "Fixing backend linting issues..."
	@cd backend && npm run lint:fix
	@echo "Fixing frontend linting issues..."
	@cd frontend && npm run lint:fix

dev: ## Start development servers (no Docker)
	@echo "Starting backend on port 5000..."
	@cd backend && npm run dev &
	@echo "Starting frontend on port 3000..."
	@cd frontend && npm run dev

up: ## Start all services with Docker Compose
	@docker-compose up --build

down: ## Stop all services
	@docker-compose down

logs: ## Show logs from all services
	@docker-compose logs -f

clean: ## Clean up Docker containers, images, and volumes
	@docker-compose down -v
	@docker system prune -f

backend-shell: ## Open shell in backend container
	@docker-compose exec backend-orchestrator sh

frontend-shell: ## Open shell in frontend container
	@docker-compose exec frontend sh

test-coverage: ## Run tests with coverage
	@echo "Backend coverage..."
	@cd backend && npm test -- --coverage
	@echo "Frontend coverage..."
	@cd frontend && npm test -- --coverage

deploy-build: ## Build and push Docker images to GCR
	@echo "Building and pushing images..."
	@docker build -t gcr.io/$(GCP_PROJECT_ID)/benchmark-backend:latest ./backend
	@docker build -t gcr.io/$(GCP_PROJECT_ID)/benchmark-frontend:latest ./frontend
	@docker push gcr.io/$(GCP_PROJECT_ID)/benchmark-backend:latest
	@docker push gcr.io/$(GCP_PROJECT_ID)/benchmark-frontend:latest

deploy-tf: ## Deploy with Terraform
	@cd terraform && terraform init && terraform apply

health-check: ## Check health of running services
	@echo "Checking backend health..."
	@curl -s http://localhost:5000/api/health | jq
	@echo "\nChecking frontend..."
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000
