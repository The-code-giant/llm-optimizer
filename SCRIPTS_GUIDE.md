# Clever Search - Scripts Guide

This guide covers all available npm scripts for the Clever Search project.

## 🚀 Root Project Scripts

Run these from the project root directory:

### Development Environment
```bash
# First-time setup (recommended for new installations)
npm run dev:first-time        # Complete first-time setup with DB migration

# Quick start development environment
npm run dev                   # Setup .env, start services, and run migrations
npm run dev:setup             # Copy env.example to .env
npm run dev:start             # Start Docker services only
npm run dev:stop              # Stop all services
npm run dev:restart           # Restart all services
npm run dev:clean             # Stop services and remove volumes
```

### Monitoring & Debugging
```bash
# View logs
npm run dev:logs              # All service logs
npm run dev:logs:backend      # Backend logs only
npm run dev:logs:frontend     # Frontend logs only
npm run dev:logs:postgres     # Database logs
npm run dev:logs:redis        # Redis logs

# Service status
npm run dev:status            # Show all service status
npm run dev:build             # Rebuild all services
```

### Shell Access
```bash
# Access service shells
npm run dev:shell:backend     # Backend container shell
npm run dev:shell:frontend    # Frontend container shell
npm run dev:shell:postgres    # PostgreSQL shell
npm run dev:shell:redis       # Redis CLI
```

### Database Operations
```bash
npm run db:migrate            # Run database migrations
npm run db:generate           # Generate new migration files
npm run db:studio             # Open Drizzle Studio
npm run db:reset              # Reset database (removes all data)
```

### Management Tools
```bash
npm run tools:start           # Start pgAdmin & Redis Commander
npm run tools:stop            # Stop management tools
```

### Project Management
```bash
# Install dependencies
npm run install:backend       # Install backend dependencies
npm run install:frontend      # Install frontend dependencies
npm run install:all           # Install all dependencies

# Code quality
npm run lint:backend          # Lint backend code
npm run lint:frontend         # Lint frontend code
npm run lint:all              # Lint all code

# Testing
npm run test:backend          # Run backend tests
npm run test:frontend         # Run frontend tests
npm run test:all              # Run all tests

# Building
npm run build:backend         # Build backend
npm run build:frontend        # Build frontend
npm run build:all             # Build all projects
```

## 🔧 Backend Scripts

Run from the `backend/` directory or use `docker-compose exec backend npm run <script>`:

### Development
```bash
npm run dev                   # Start with hot reload
npm run dev:debug             # Start with debugger on port 9229
npm run start                 # Start production build
npm run build                 # Build TypeScript to JavaScript
npm run build:watch           # Build with watch mode
```

### Database
```bash
npm run db:generate           # Generate migration files
npm run db:migrate            # Apply migrations
npm run db:push               # Push schema changes directly
npm run db:studio             # Open Drizzle Studio on port 4983
npm run db:seed               # Seed database with initial data
```

### Code Quality
```bash
npm run lint                  # Run ESLint with auto-fix
npm run type-check            # Check TypeScript types
npm run test                  # Run Jest tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage report
```

## 📱 Frontend Scripts

Run from the `frontend/` directory or use `docker-compose exec frontend npm run <script>`:

### Development
```bash
npm run dev                   # Start Next.js dev server with Turbopack
npm run dev:debug             # Start with Node.js debugger
npm run build                 # Build for production
npm run start                 # Start production server
```

### Code Quality
```bash
npm run lint                  # Run Next.js linting
npm run lint:fix              # Run linting with auto-fix
npm run type-check            # Check TypeScript types
npm run analyze               # Analyze bundle size
```

### Testing
```bash
npm run test                  # Run Jest tests
npm run test:watch            # Run tests in watch mode
npm run test:coverage         # Run tests with coverage
```

### Storybook (Optional)
```bash
npm run storybook             # Start Storybook dev server
npm run build-storybook       # Build Storybook for production
```

## 🐳 Docker-Specific Usage

When services are running in Docker, you can execute scripts inside containers:

```bash
# Backend scripts
docker compose exec backend npm run dev
docker compose exec backend npm run db:migrate
docker compose exec backend npm run test

# Frontend scripts  
docker compose exec frontend npm run dev
docker compose exec frontend npm run build
docker compose exec frontend npm run test

# Quick database access
docker compose exec postgres psql -U postgres -d cleaver_search_dev
docker compose exec redis redis-cli
```

## 🔍 Debugging

### Backend Debugging
```bash
# Start backend with debugger
npm run dev:debug

# In VS Code, attach to localhost:9229
# Or use Chrome DevTools: chrome://inspect
```

### Frontend Debugging
```bash
# Start frontend with debugger
npm run dev:debug

# Use browser dev tools or VS Code debugger
```

### Database Debugging
```bash
# Open Drizzle Studio
npm run db:studio
# Then visit: http://localhost:4983

# Or use pgAdmin
npm run tools:start
# Then visit: http://localhost:5050
```

## 📊 Common Workflows

### Starting Fresh Development
```bash
# For first-time setup:
npm run dev:first-time       # Complete setup with database migration

# For subsequent development:
npm run dev                  # Start everything (includes automatic migration)

# Manual database setup if needed:
npm run db:migrate          # Set up database schema manually
```

### Adding New Dependencies
```bash
# Backend dependency
docker compose exec backend npm install package-name
docker compose restart backend

# Frontend dependency
docker compose exec frontend npm install package-name
docker compose restart frontend
```

### Running Tests
```bash
# All tests
npm run test:all

# Specific service tests
npm run test:backend
npm run test:frontend

# With coverage
docker compose exec backend npm run test:coverage
docker compose exec frontend npm run test:coverage
```

### Database Changes
```bash
# After modifying schema
npm run db:generate          # Generate migration
npm run db:migrate           # Apply migration

# Or for development
npm run db:push              # Push changes directly
```

## 🚨 Troubleshooting Scripts

```bash
# Reset everything
npm run dev:clean
npm run dev:start

# Rebuild specific service
docker compose up --build backend
docker compose up --build frontend

# Check service health
npm run dev:status
npm run dev:logs

# Database issues
npm run db:reset
npm run db:migrate
```

## 💡 Tips

- Use `npm run dev` for quickest startup
- Always run `npm run db:migrate` after pulling schema changes
- Use `npm run dev:logs:backend` to debug API issues
- Use `npm run tools:start` for database management UI
- Run `npm run test:all` before committing changes

For more detailed Docker instructions, see [DOCKER_README.md](./DOCKER_README.md). 