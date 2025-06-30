# LLM Optimizer - Docker Development Setup

This Docker setup provides a complete development environment for the LLM Optimizer with all necessary services.

## 🚀 Quick Start

1. **Copy environment variables:**
   ```bash
   cp env.example .env
   ```

2. **Update your API keys in `.env`:**
   ```bash
   # Add your LLM API keys
   OPENAI_API_KEY=your-openai-api-key-here
   ANTHROPIC_API_KEY=your-anthropic-api-key-here
   ```

3. **Start the development environment:**
   ```bash
   ./scripts/start-dev.sh
   ```

4. **Access your applications:**
   - 📱 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:3001
   - 🗄️ **Database**: localhost:5432
   - 🚀 **Redis**: localhost:6379

## 📦 Services Included

### Core Services
- **PostgreSQL 16**: Main database for user data, sites, pages, and analysis
- **Redis 7**: Caching and job queue management
- **Backend API**: TypeScript/Express server with Drizzle ORM
- **Frontend**: Next.js application with hot reload

### Management Tools (Optional)
- **pgAdmin**: Database management interface at http://localhost:5050
- **Redis Commander**: Redis management interface at http://localhost:8081

## 🛠 Available Commands

### Start/Stop Services
```bash
# Start all services
./scripts/start-dev.sh

# Stop all services
./scripts/stop-dev.sh

# Start with management tools
docker compose --profile tools up -d
```

### View Logs
```bash
# View all logs
./scripts/logs.sh

# View specific service logs
./scripts/logs.sh backend
./scripts/logs.sh frontend
./scripts/logs.sh postgres
./scripts/logs.sh redis
```

### Database Operations
```bash
# Run database migrations
docker-compose exec backend npm run db:migrate

# Generate new migration
docker-compose exec backend npm run db:generate

# Open Drizzle Studio
docker-compose exec backend npm run db:studio
```

### Manual Docker Commands
```bash
# Rebuild specific service
docker compose up --build backend

# View service status
docker compose ps

# Access service shell
docker compose exec backend sh
docker compose exec postgres psql -U postgres -d llm_optimizer_dev

# Clean restart (removes volumes)
docker compose down -v
docker compose up --build
```

## 🗄️ Database Details

- **Host**: localhost:5432
- **Database**: llm_optimizer_dev
- **Username**: postgres
- **Password**: postgres123

### Connect with external tools:
```bash
# Using psql
psql -h localhost -p 5432 -U postgres -d llm_optimizer_dev

# Using DBeaver/pgAdmin external connection
Host: localhost
Port: 5432
Database: llm_optimizer_dev
Username: postgres
Password: postgres123
```

## 🚀 Redis Details

- **Host**: localhost:6379
- **No password required** (development setup)

### Connect with Redis CLI:
```bash
# Via Docker
docker compose exec redis redis-cli

# External redis-cli
redis-cli -h localhost -p 6379
```

## 🔧 Development Workflow

### Making Code Changes
- **Backend**: Code changes trigger automatic restart via `ts-node`
- **Frontend**: Hot reload is enabled for immediate updates
- **Database**: Changes persist in Docker volumes

### Adding New Dependencies
```bash
# Backend dependencies
docker compose exec backend npm install package-name
docker compose restart backend

# Frontend dependencies  
docker compose exec frontend npm install package-name
docker compose restart frontend
```

### Updating Packages After Git Pull
When you pull changes that include new packages or dependency updates:

```bash
# Install new/updated packages for frontend
docker compose exec frontend npm install

# If you encounter dependency conflicts (e.g., React version issues)
docker compose exec frontend npm install --legacy-peer-deps

# Restart the frontend service
docker compose restart frontend

# Check if everything is working
docker compose logs frontend --tail 10

# For backend updates
docker compose exec backend npm install
docker compose restart backend
```

### Environment Variables
- Edit `.env` file for local changes
- Restart affected services: `docker compose restart backend frontend`

## 🐛 Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker --version
docker compose version

# View detailed logs
docker compose logs backend
docker compose logs postgres
```

### Database connection issues
```bash
# Check if PostgreSQL is ready
docker compose exec postgres pg_isready -U postgres

# Reset database
docker compose down -v
docker compose up -d postgres
```

### Port conflicts
- Change ports in `docker-compose.yml` if needed
- Default ports: 3000 (frontend), 3001 (backend), 5432 (postgres), 6379 (redis)

### Hot Reload Not Working
```bash
# Frontend hot reload issues (common on macOS)
docker compose restart frontend

# Check if file changes are synced
docker compose exec frontend ls -la /app/src/app/page.tsx

# View frontend logs for compilation errors
docker compose logs frontend --tail 20

# Force rebuild if needed
docker compose up --build frontend
```

### Permission issues (Linux/Mac)
```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix file ownership
sudo chown -R $USER:$USER .
```

## 🔄 Updating the Setup

### Pull latest changes
```bash
git pull origin main
docker compose down
docker compose up --build
```

### Reset everything
```bash
docker compose down -v
docker system prune -f
./scripts/start-dev.sh
```

## 📝 Notes

- **Data Persistence**: Database and Redis data persist in Docker volumes
- **Hot Reload**: Both frontend and backend support hot reload
- **API Keys**: Required for LLM features - add to `.env` file
- **Memory Usage**: Full stack uses ~2GB RAM in development

## 🎯 Next Steps

1. Set up your LLM API keys in `.env`
2. Run database migrations: `docker compose exec backend npm run db:migrate`
3. Start developing your features!
4. Access pgAdmin for database management (optional)

For production deployment, use the production Docker configuration (coming soon). 