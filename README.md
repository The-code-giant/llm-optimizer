# Cleaver Search

A SaaS platform to optimize website content for Large Language Models (LLMs) like ChatGPT, Claude, and others.

## 🚀 Quick Start

### First-Time Setup (Choose one)
```bash
# Option 1: Using Makefile (recommended)
make first-time

# Option 2: Using npm
npm run setup

# Option 3: Manual setup
git clone <your-repo-url>
cd Cleaver-Search
npm run setup
```

This will:
- ✅ Copy environment variables from `env.example` to `.env`
- ✅ Start all Docker services (PostgreSQL, Redis, Backend, Frontend)
- ✅ Create database (`cleaver_search_dev`) automatically
- ✅ Wait for services to be ready
- ✅ Run database migrations to create all tables
- ✅ Display success message with URLs

### Subsequent Development (Choose one)
```bash
# Option 1: Using Makefile (recommended)
make dev

# Option 2: Using npm
npm run dev
```

This automatically includes database creation and migrations, so you're always up to date.

## 🌐 Access Points

After running the setup:

- **Frontend (Next.js)**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/healthz

### Optional Management Tools
```bash
# Start pgAdmin and Redis Commander
npm run tools:start
```

- **pgAdmin**: http://localhost:5050 (admin@admin.com / admin)
- **Redis Commander**: http://localhost:8081

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **Infrastructure**: Docker, Docker Compose

## 📚 Documentation

- [Scripts Guide](SCRIPTS_GUIDE.md) - Complete list of available commands
- [Docker Setup](DOCKER_README.md) - Detailed Docker configuration
- [Memory Bank](memory/) - Project documentation and context

## 🔧 Development Commands

**Scripts have been simplified!** We reduced from 37 scripts to just 19 essential ones, organized logically.

### Using Makefile (Recommended)
```bash
# Quick Start
make dev                      # Start development environment
make first-time               # Complete first-time setup

# Environment Management
make start                    # Start all services
make stop                     # Stop all services
make restart                  # Restart all services
make clean                    # Stop and remove all volumes
make status                   # Show service status

# Monitoring
make logs                     # View all logs
make shell                    # Access backend shell

# Database
make db-migrate               # Run database migrations
make db-studio                # Open Drizzle Studio

# Tools
make tools                    # Start pgAdmin & Redis Commander
```

### Using npm Scripts
```bash
# Environment
npm run dev                   # Start development environment
npm run setup                 # First-time setup
npm run stop                  # Stop all services
npm run clean                 # Stop and remove all volumes
npm run logs                  # View all logs

# Database
npm run db:migrate            # Run migrations manually
npm run db:studio             # Open Drizzle Studio

# Code Quality
npm run install               # Install all dependencies
npm run lint                  # Lint all code
npm run test                  # Run all tests
npm run build                 # Build all projects
```

## 🎯 Pro Tips

- **Debugging**: Use `npm run dev:debug` for debugger on port 9229
- **Logs**: `docker compose logs backend -f` to follow live logs
- **Database changes**: Run `npm run db:migrate` after schema changes
- **Environment**: Changes to `.env` require container restart

## 🐳 Docker Services

- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache/queue (port 6379)
- **backend**: Express.js API (port 3001)
- **frontend**: Next.js app (port 3000)

## 📝 Environment Variables

Copy `env.example` to `.env` and adjust as needed:

```bash
cp env.example .env
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test:all`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details. 