# Development Scripts

This directory contains utility scripts for managing the Clever Search development environment.

## Available Scripts

### 🚀 first-time-setup.sh
Complete first-time setup for new developers. This script:
- Creates `.env` file from example
- Builds and starts all Docker services
- Creates the database
- Runs migrations
- Provides helpful next steps

**Usage:** `./scripts/first-time-setup.sh` or `npm run dev:first-time` or `make first-time`

### 🗄️ create-db.sh
Creates the `cleaver_search_dev` database if it doesn't exist.

**Usage:** `./scripts/create-db.sh` or `npm run db:create`

### ▶️ start-dev.sh
Starts the development environment with Docker services.

**Usage:** `./scripts/start-dev.sh` or `make start`

### ⏹️ stop-dev.sh
Stops all Docker services.

**Usage:** `./scripts/stop-dev.sh` or `make stop`

### 📋 logs.sh
Shows logs from all services or a specific service.

**Usage:** `./scripts/logs.sh [service-name]` or `make logs`

## Quick Commands

For first-time setup:
```bash
make first-time
# or
npm run dev:first-time
```

For regular development:
```bash
make dev
# or
npm run dev
```

To view logs:
```bash
make logs
# or
docker compose logs -f
``` 