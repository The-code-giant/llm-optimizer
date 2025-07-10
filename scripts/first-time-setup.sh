#!/bin/bash

# First-time Setup Script for Cleaver Search Development Environment

echo "🚀 Cleaver Search - First Time Setup"
echo "======================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your API keys."
else
    echo "✅ .env file already exists"
fi

# Clean up any existing containers (optional)
echo "🧹 Cleaning up any existing containers..."
docker compose down

# Build and start services
echo "🔧 Building and starting services..."
docker compose up --build -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker compose exec postgres pg_isready -U postgres; do
    echo "Waiting for database..."
    sleep 2
done

# Create database
echo "🗄️ Setting up database..."
./scripts/create-db.sh

# Start backend and frontend
echo "🔧 Starting backend and frontend..."
docker compose up --build -d backend frontend

# Wait for services to fully start
echo "⏳ Waiting for services to start..."
sleep 10

# Run database migrations
echo "📊 Running database migrations..."
docker compose exec backend npm run db:migrate:safe

# Show final status
echo ""
echo "📊 Final Status:"
docker compose ps

echo ""
echo "🎉 First-time setup complete!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "❤️  Health check: http://localhost:3001/healthz"
echo "📚 API docs: http://localhost:3001/api-docs"
echo "🗄️  Database: localhost:5432"
echo "🚀 Redis: localhost:6379"
echo ""
echo "📖 Next steps:"
echo "   - Update your API keys in the .env file"
echo "   - Visit http://localhost:3000 to start using the app"
echo "   - Run 'make logs' to view service logs"
echo "   - Run 'make stop' to stop all services"
echo "" 