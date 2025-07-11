# Clever Search - Development Commands

.PHONY: help dev first-time start stop logs clean build restart status shell db-migrate db-studio tools

# Default target
help:
	@echo "🚀 Clever Search Development Commands"
	@echo ""
	@echo "Quick Start:"
	@echo "  make dev       - Start development environment (full setup)"
	@echo "  make first-time - Complete first-time setup (recommended for new users)"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make start     - Start all development services"
	@echo "  make stop      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make clean     - Stop services and remove volumes"
	@echo ""
	@echo "Development Commands:"
	@echo "  make logs      - View all service logs"
	@echo "  make status    - Show service status"
	@echo "  make build     - Rebuild all services"
	@echo "  make shell     - Access backend shell"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-migrate - Run database migrations"
	@echo "  make db-studio  - Open Drizzle Studio"
	@echo ""
	@echo "Tools:"
	@echo "  make tools     - Start management tools (pgAdmin, Redis Commander)"

# Quick development start
dev:
	@echo "🚀 Starting development environment..."
	@npm run dev

# First-time setup
first-time:
	@echo "🚀 Running first-time setup..."
	@npm run setup

# Setup commands
start:
	@echo "🚀 Starting Clever Search development environment..."
	@./scripts/start-dev.sh

stop:
	@echo "🛑 Stopping services..."
	@./scripts/stop-dev.sh

restart: stop start
	@echo "🔄 Services restarted"

clean:
	@echo "🧹 Cleaning up (this will remove all data)..."
	@docker compose down -v
	@docker system prune -f
	@echo "✅ Cleanup complete"

# Development commands
logs:
	@./scripts/logs.sh

status:
	@echo "📊 Service Status:"
	@docker compose ps

build:
	@echo "🔨 Rebuilding services..."
	@docker compose build --no-cache
	@docker compose up -d

shell:
	@echo "🐚 Accessing backend shell..."
	@docker compose exec backend sh

# Database commands
db-migrate:
	@echo "📊 Running database migrations..."
	@docker compose exec backend npm run db:migrate

db-studio:
	@echo "🎛️ Opening Drizzle Studio..."
	@docker compose exec backend npm run db:studio

# Tools
tools:
	@echo "🛠️ Starting management tools..."
	@docker compose --profile tools up -d
	@echo "📊 pgAdmin: http://localhost:5050"
	@echo "🔍 Redis Commander: http://localhost:8081"

# Quick development setup
dev-setup:
	@echo "🚀 Setting up development environment..."
	@if [ ! -f .env ]; then cp env.example .env; echo "📝 Created .env file - please update your API keys"; fi
	@make start
	@echo ""
	@echo "🎉 Development environment ready!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:3001" 