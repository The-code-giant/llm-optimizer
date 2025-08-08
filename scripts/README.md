# Development Scripts

This directory contains utility scripts for managing the Clever Search development environment.

## Available Scripts

### 🚀 first-time-setup.sh
Complete first-time setup for new developers. This script:
- Creates `.env` file from example
- Creates the database
- Runs migrations
- Provides helpful next steps

**Usage:** `./scripts/first-time-setup.sh` or `npm run dev:first-time` or `make first-time`

Notes:
- Docker is not used. Services run as direct Node.js processes.
- Use the npm scripts in the project root for dev, build, and DB tasks.

## Quick Commands

For first-time setup:
```bash
make first-time
# or
npm run dev:first-time
```

For regular development:
```bash
npm run dev
```

To view logs:
```bash
# Frontend and backend logs appear in your terminal where `npm run dev` is running
# If using PM2 in production, see PM2 commands in the main README
``` 