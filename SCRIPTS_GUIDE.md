# Cleversearch - Scripts Guide

This guide covers all available npm scripts for the Cleversearch project.

## 🚀 First-Time Setup

```bash
# 1. Copy environment variables and update them
cp env.example .env
# Edit .env and set your Neon DB, Redis, and API keys

# 2. Run the setup script (installs dependencies and runs DB migration)
npm run setup
```

This will:
- Install backend and frontend dependencies
- Run Drizzle migrations to initialize your Neon/Postgres database
- Print next steps and URLs

## 🚀 Development Environment

```bash
# Start both backend and frontend in parallel
npm run dev
```
- **Frontend (Next.js)**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/healthz

## 🗄️ Database Management

```bash
# Run Drizzle migrations (after schema changes)
npm run db:migrate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
# Then visit: http://localhost:4983
```

## 📝 Environment Variables
- Copy `env.example` to `.env` and update:
  - `NEON_DATABASE_URL` (Neon Postgres connection string)
  - `REDIS_URL` (or `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` for Redis)
  - `OPENAI_API_KEY` (for AI analysis)
  - Any other required keys

## 🧑‍💻 Common Scripts
```bash
npm run setup        # First-time setup (installs deps, runs migration)
npm run dev          # Start backend and frontend in parallel
npm run db:migrate   # Run Drizzle migrations
npm run db:studio    # Open Drizzle Studio (DB browser)
npm run lint         # Lint all code
npm run test         # Run all tests
npm run build        # Build all projects
```

## 🧠 Backend Scripts

Run from the `backend/` directory:

```bash
npm run dev                   # Start with hot reload
npm run dev:debug             # Start with debugger on port 9229
npm run start                 # Start production build
npm run build                 # Build TypeScript to JavaScript
npm run db:generate           # Generate migration files
npm run db:migrate            # Apply migrations
npm run db:push               # Push schema changes directly
npm run db:studio             # Open Drizzle Studio on port 4983
npm run db:seed               # Seed database with initial data
npm run lint                  # Run ESLint with auto-fix
npm run type-check            # Check TypeScript types
npm run test                  # Run Jest tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage report
```

## 📱 Frontend Scripts

Run from the `frontend/` directory:

```bash
npm run dev                   # Start Next.js dev server
npm run build                 # Build for production
npm run start                 # Start production server
npm run lint                  # Run Next.js linting
npm run lint:fix              # Run linting with auto-fix
npm run type-check            # Check TypeScript types
npm run analyze               # Analyze bundle size
npm run test                  # Run Jest tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage
```

## 🧠 Tips
- Use `npm run dev` for quickest startup
- Always run `npm run db:migrate` after pulling schema changes
- Use `npm run db:studio` for visual DB management
- Run `npm run test` before committing changes

For more details, see the main [README.md](./README.md). 