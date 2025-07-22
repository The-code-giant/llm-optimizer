# Clever Search

A SaaS platform to optimize website content for Large Language Models (LLMs) like ChatGPT, Claude, and others.

## 🚀 Quick Start

### First-Time Setup
```bash
# 1. Clone the repo and enter the directory
 git clone <your-repo-url>
 cd Clever-Search

# 2. Copy environment variables and update them
 cp env.example .env
 # Edit .env and set your Neon DB, Redis, and API keys

# 3. Run the setup script (installs dependencies and runs DB migration)
 npm run setup
```

This will:
- ✅ Copy environment variables from `env.example` to `.env` (if missing)
- ✅ Install backend and frontend dependencies
- ✅ Run Drizzle migrations to initialize your Neon/Postgres database
- ✅ Print next steps and URLs

### Development Workflow
```bash
# Start both backend and frontend in parallel
npm run dev
```
- **Frontend (Next.js)**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/healthz

### Database Management
```bash
# Run Drizzle migrations (after schema changes)
npm run db:migrate

# Open Drizzle Studio (visual DB browser)
npm run db:studio
# Then visit: http://localhost:4983
```

## 🛠️ Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: Neon (PostgreSQL serverless)
- **Cache/Queue**: Redis (external, e.g. EC2)

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

## 🧠 Documentation
- [Scripts Guide](SCRIPTS_GUIDE.md) - Complete list of available commands
- [Memory Bank](memory/) - Project documentation and context

## 🏁 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Submit a pull request

## 📄 License
MIT License - see LICENSE file for details. 



Backend usefull command
# Check status
pm2 status

# View real-time logs
pm2 logs cleversearch-backend --lines 50

# Restart the application
pm2 restart cleversearch-backend

# Reload with zero downtime
pm2 reload cleversearch-backend

# Monitor resources
pm2 monit

# Stop the application
pm2 stop cleversearch-backend

# Delete the application from PM2
pm2 delete cleversearch-backend
