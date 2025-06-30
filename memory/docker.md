# LLM Optimizer Docker Implementation Guide

**Version:** 2.0
**Date:** December 2024
**Status:** ✅ Complete and Tested

## 1. Overview

The LLM Optimizer uses a comprehensive Docker setup for development and production environments. The implementation includes:

- **Multi-service architecture** with PostgreSQL, Redis, Express backend, and Next.js frontend
- **Hot reload** for both frontend and backend development
- **Database migrations** with Drizzle ORM
- **One-command setup** for new developers
- **Production-ready configuration** with health checks and proper networking

## 2. Architecture

```
┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │
│   (Next.js)     │◄──►│   (Express)     │
│   Port: 3000    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────┐    ┌─────────────────┐
         │   PostgreSQL    │    │     Redis       │
         │   Port: 5432    │    │   Port: 6379    │
         └─────────────────┘    └─────────────────┘
```

## 3. Core Files

### 3.1 docker-compose.yml

```yaml
services:
  # PostgreSQL Database
  postgres:
    image: postgres:16
    container_name: llm-optimizer-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: llm_optimizer_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - llm-optimizer-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d llm_optimizer_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache/Queue
  redis:
    image: redis:7-alpine
    container_name: llm-optimizer-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - llm-optimizer-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend Express App
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: llm-optimizer-backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_URL: postgresql://postgres:postgres_password@postgres:5432/llm_optimizer_dev
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      CORS_ORIGIN: http://localhost:3000
    ports:
      - "3001:3001"
      - "9229:9229"  # Debug port
    volumes:
      - ./backend:/app:cached
      - /app/node_modules
      - ./shared:/app/shared:cached
    networks:
      - llm-optimizer-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev

  # Frontend Next.js App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: llm-optimizer-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1
      NEXT_PUBLIC_APP_URL: http://localhost:3000
      WATCHPACK_POLLING: true
      CHOKIDAR_USEPOLLING: true
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app:cached
      - /app/node_modules
      - /app/.next
      - ./shared:/app/shared:cached
    networks:
      - llm-optimizer-network
    depends_on:
      - backend
    command: npm run dev

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: llm-optimizer-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@llmoptimizer.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - llm-optimizer-network
    depends_on:
      - postgres
    profiles:
      - tools

  # Optional: Redis Commander for Redis management
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: llm-optimizer-redis-commander
    restart: unless-stopped
    environment:
      REDIS_HOSTS: local:redis:6379
    ports:
      - "8081:8081"
    networks:
      - llm-optimizer-network
    depends_on:
      - redis
    profiles:
      - tools

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:

networks:
  llm-optimizer-network:
    driver: bridge
```

### 3.2 Backend Dockerfile.dev

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port and debug port
EXPOSE 3001 9229

# Start development server with hot reload
CMD ["npm", "run", "dev"]
```

### 3.3 Frontend Dockerfile.dev

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
```

## 4. Scripts and Automation

### 4.1 Package.json Scripts (Root)

```json
{
  "scripts": {
    "dev": "npm run dev:setup && npm run dev:start && npm run dev:init",
    "dev:setup": "cp env.example .env 2>/dev/null || true",
    "dev:start": "docker compose up --build -d",
    "dev:init": "npm run dev:wait && npm run db:migrate",
    "dev:wait": "echo 'Waiting for services to be ready...' && sleep 10",
    "dev:first-time": "npm run dev:setup && npm run dev:start && npm run dev:wait && npm run db:migrate && echo '🎉 Setup complete! Visit http://localhost:3000'",
    "dev:stop": "docker compose down",
    "dev:restart": "npm run dev:stop && npm run dev:start",
    "dev:clean": "docker compose down -v && docker system prune -f",
    "dev:logs": "docker compose logs -f",
    "dev:logs:backend": "docker compose logs backend -f",
    "dev:logs:frontend": "docker compose logs frontend -f",
    "dev:status": "docker compose ps",
    "dev:shell:backend": "docker compose exec backend sh",
    "dev:shell:frontend": "docker compose exec frontend sh",
    "dev:shell:postgres": "docker compose exec postgres psql -U postgres -d llm_optimizer_dev",
    "dev:shell:redis": "docker compose exec redis redis-cli",
    "db:migrate": "docker compose exec backend npm run db:migrate:safe",
    "db:studio": "docker compose exec backend npm run db:studio",
    "db:reset": "docker compose exec backend npm run db:reset",
    "db:seed": "docker compose exec backend npm run db:seed",
    "tools:start": "docker compose --profile tools up -d pgadmin redis-commander",
    "tools:stop": "docker compose --profile tools down",
    "install:all": "npm install && npm run install:backend && npm run install:frontend",
    "install:backend": "cd backend && npm install",
    "install:frontend": "cd frontend && npm install",
    "lint:all": "npm run lint:backend && npm run lint:frontend",
    "lint:backend": "cd backend && npm run lint",
    "lint:frontend": "cd frontend && npm run lint",
    "test:all": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm run test",
    "test:frontend": "cd frontend && npm run test",
    "build:all": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build"
  }
}
```

### 4.2 Helper Scripts

#### scripts/start-dev.sh
```bash
#!/bin/bash
set -e

echo "🚀 Starting LLM Optimizer development environment..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
fi

# Start services
echo "🐳 Starting Docker containers..."
docker compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️ Running database migrations..."
docker compose exec backend npm run db:migrate:safe

echo "🎉 Development environment is ready!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API Docs: http://localhost:3001/api-docs"
echo "   Health:   http://localhost:3001/healthz"
echo ""
echo "🛠️ Management tools (optional):"
echo "   pgAdmin:        http://localhost:5050 (admin@llmoptimizer.com / admin)"
echo "   Redis Commander: http://localhost:8081"
echo ""
echo "📝 Useful commands:"
echo "   npm run dev:logs     - View all logs"
echo "   npm run dev:stop     - Stop all services"
echo "   npm run db:studio    - Open Drizzle Studio"
```

#### scripts/stop-dev.sh
```bash
#!/bin/bash
set -e

echo "🛑 Stopping LLM Optimizer development environment..."
docker compose down
echo "✅ All services stopped"
```

#### scripts/logs.sh
```bash
#!/bin/bash
if [ -z "$1" ]; then
    echo "📋 Showing logs for all services..."
    docker compose logs -f
else
    echo "📋 Showing logs for $1..."
    docker compose logs $1 -f
fi
```

## 5. Configuration Files

### 5.1 Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres_password@localhost:5432/llm_optimizer_dev
POSTGRES_DB=llm_optimizer_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# Backend
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_URL=http://localhost:3000

# External APIs (add your keys)
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn_here
```

### 5.2 Database Initialization (docker/postgres/init.sql)

```sql
-- Initialize the database
CREATE DATABASE llm_optimizer_dev;

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'llm_optimizer_user') THEN

      CREATE ROLE llm_optimizer_user LOGIN PASSWORD 'user_password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE llm_optimizer_dev TO llm_optimizer_user;

-- Enable extensions
\c llm_optimizer_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

### 5.3 .dockerignore Files

#### Backend .dockerignore
```
node_modules
npm-debug.log*
.npm
.env
.env.local
.env.production
coverage
.nyc_output
dist
build
logs
*.log
.DS_Store
.vscode
.idea
```

#### Frontend .dockerignore
```
node_modules
npm-debug.log*
.npm
.env
.env.local
.env.production
.next
out
coverage
.nyc_output
dist
build
logs
*.log
.DS_Store
.vscode
.idea
```

## 6. Hot Reload Configuration

### 6.1 Backend Hot Reload (nodemon.json)

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "exec": "ts-node --transpile-only src/index.ts",
  "delay": "1000"
}
```

### 6.2 Frontend Hot Reload (next.config.ts)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Docker hot reload optimization
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
```

## 7. Database Setup

### 7.1 Drizzle Configuration (backend/drizzle.config.ts)

```typescript
import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 7.2 Database Schema (backend/src/db/schema.ts)

```typescript
import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sites table
export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  trackerId: uuid('tracker_id').defaultRandom().notNull().unique(),
  status: varchar('status', { length: 50 }).default('created').notNull(),
  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Pages table
export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 1000 }).notNull(),
  title: varchar('title', { length: 500 }),
  contentSnapshot: text('content_snapshot'),
  lastScannedAt: timestamp('last_scanned_at'),
  lastAnalysisAt: timestamp('last_analysis_at'),
  llmReadinessScore: real('llm_readiness_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Analysis results table
export const analysisResults = pgTable('analysis_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
  llmModelUsed: varchar('llm_model_used', { length: 100 }),
  score: real('score').notNull(),
  recommendations: jsonb('recommendations').default([]).notNull(),
  rawLlmOutput: text('raw_llm_output'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Injected content table
export const injectedContent = pgTable('injected_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  content: text('content').notNull(),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Page injected content (many-to-many)
export const pageInjectedContent = pgTable('page_injected_content', {
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  injectedContentId: uuid('injected_content_id').notNull().references(() => injectedContent.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tracker data table
export const trackerData = pgTable('tracker_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }),
  pageUrl: varchar('page_url', { length: 1000 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  sessionId: uuid('session_id'),
  anonymousUserId: uuid('anonymous_user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sites: many(sites),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  user: one(users, {
    fields: [sites.userId],
    references: [users.id],
  }),
  pages: many(pages),
  injectedContent: many(injectedContent),
  trackerData: many(trackerData),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  site: one(sites, {
    fields: [pages.siteId],
    references: [sites.id],
  }),
  analysisResults: many(analysisResults),
  pageInjectedContent: many(pageInjectedContent),
}));

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  page: one(pages, {
    fields: [analysisResults.pageId],
    references: [pages.id],
  }),
}));

export const injectedContentRelations = relations(injectedContent, ({ one, many }) => ({
  site: one(sites, {
    fields: [injectedContent.siteId],
    references: [sites.id],
  }),
  pageInjectedContent: many(pageInjectedContent),
}));

export const pageInjectedContentRelations = relations(pageInjectedContent, ({ one }) => ({
  page: one(pages, {
    fields: [pageInjectedContent.pageId],
    references: [pages.id],
  }),
  injectedContent: one(injectedContent, {
    fields: [pageInjectedContent.injectedContentId],
    references: [injectedContent.id],
  }),
}));

export const trackerDataRelations = relations(trackerData, ({ one }) => ({
  site: one(sites, {
    fields: [trackerData.siteId],
    references: [sites.id],
  }),
}));
```

## 8. Development Workflow

### 8.1 First-Time Setup

```bash
# Clone the repository
git clone <repository-url>
cd AI-SEO-optimizer

# Run first-time setup
npm run dev:first-time
```

This command will:
1. ✅ Copy environment variables from `env.example` to `.env`
2. ✅ Start all Docker services (PostgreSQL, Redis, Backend, Frontend)
3. ✅ Wait for services to be ready
4. ✅ Run database migrations to create all tables
5. ✅ Display success message with URLs

### 8.2 Daily Development

```bash
# Start development environment
npm run dev

# View logs
npm run dev:logs

# Stop services
npm run dev:stop

# Database operations
npm run db:studio        # Open Drizzle Studio
npm run db:migrate       # Run migrations
npm run db:reset         # Reset database

# Access shells
npm run dev:shell:backend    # Backend container shell
npm run dev:shell:postgres   # PostgreSQL shell
npm run dev:shell:redis      # Redis CLI
```

### 8.3 Access Points

After running `npm run dev:first-time` or `npm run dev`:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/healthz
- **pgAdmin** (optional): http://localhost:5050
- **Redis Commander** (optional): http://localhost:8081

## 9. Production Considerations

### 9.1 Production Dockerfile (backend/Dockerfile)

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

RUN npm run build

EXPOSE 3001

USER node

CMD ["npm", "start"]
```

### 9.2 Production Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@prod-db:5432/llm_optimizer_prod
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=super-secure-production-secret
CORS_ORIGIN=https://your-domain.com
```

## 10. Troubleshooting

### 10.1 Common Issues

**Port Conflicts:**
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001
lsof -i :5432
lsof -i :6379

# Stop conflicting services
docker compose down
```

**Database Connection Issues:**
```bash
# Check database status
npm run dev:status
docker compose logs postgres

# Reset database
npm run db:reset
```

**Hot Reload Not Working:**
```bash
# Restart frontend service
docker compose restart frontend

# Check logs
npm run dev:logs:frontend
```

**Permission Issues:**
```bash
# Fix permissions (macOS/Linux)
sudo chown -R $USER:$USER .
```

### 10.2 Performance Optimization

**Docker Performance (macOS):**
- Use `:cached` volume mounts for better performance
- Enable file sharing optimization in Docker Desktop
- Consider using Docker Desktop alternatives like Colima

**Database Performance:**
- Ensure proper indexing in production
- Use connection pooling
- Monitor query performance

## 11. Testing

### 11.1 Health Checks

All services include health checks:
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping`
- **Backend**: Custom health endpoint
- **Frontend**: HTTP response check

### 11.2 Integration Testing

```bash
# Test database connection
npm run dev:shell:postgres

# Test Redis connection
npm run dev:shell:redis

# Test API endpoints
curl http://localhost:3001/healthz
curl http://localhost:3001/api-docs
```

## 12. Security

### 12.1 Development Security

- Environment variables are not committed to git
- Database passwords are configurable
- CORS is properly configured
- JWT secrets are environment-specific

### 12.2 Production Security

- Use strong, unique passwords
- Enable SSL/TLS for all connections
- Implement proper firewall rules
- Regular security updates for base images
- Use secrets management for sensitive data

---

**Status**: ✅ Complete and Tested
**Last Updated**: December 2024
**Next Steps**: Production deployment configuration 