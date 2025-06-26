# LLM Optimizer

A SaaS platform to optimize website content for Large Language Models (LLMs) like ChatGPT, Claude, and others.

## 🚀 Quick Start

### First-Time Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd AI-SEO-optimizer

# Complete first-time setup (starts all services + database migration)
npm run dev:first-time
```

This will:
- ✅ Copy environment variables from `env.example` to `.env`
- ✅ Start all Docker services (PostgreSQL, Redis, Backend, Frontend)
- ✅ Wait for services to be ready
- ✅ Run database migrations to create all tables
- ✅ Display success message with URLs

### Subsequent Development
```bash
# Start development environment
npm run dev
```

This automatically includes database migrations, so you're always up to date.

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

```bash
# Environment
npm run dev:stop              # Stop all services
npm run dev:restart           # Restart all services
npm run dev:logs              # View all logs

# Database
npm run db:studio             # Open Drizzle Studio
npm run db:migrate            # Run migrations manually

# Code Quality
npm run lint:all              # Lint all code
npm run test:all              # Run all tests
npm run build:all             # Build all projects
```

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