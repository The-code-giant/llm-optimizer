#!/bin/bash

# LLM Optimizer Development Environment Startup Script

echo "🚀 Starting LLM Optimizer Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if environment file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your API keys."
fi

# Build and start services
echo "🔧 Building and starting services..."
docker compose up --build -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Start backend and frontend
echo "🔧 Starting backend and frontend..."
docker compose up --build -d backend frontend

# Show status
echo "📊 Services Status:"
docker compose ps

echo ""
echo "🎉 Development environment is ready!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "🗄️  Database: localhost:5432"
echo "🚀 Redis: localhost:6379"
echo ""
echo "Optional management tools:"
echo "📊 pgAdmin: http://localhost:5050 (run with --profile tools)"
echo "🔍 Redis Commander: http://localhost:8081 (run with --profile tools)"
echo ""
echo "To view logs: docker compose logs -f [service_name]"
echo "To stop: docker compose down" 