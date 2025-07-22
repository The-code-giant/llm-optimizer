#!/bin/bash

# First-time Setup Script for Clever Search Development Environment (No Docker)

echo "🚀 Clever Search - First Time Setup"
echo "======================================"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your API keys and DB/Redis info."
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo ""
echo "📊 Running database migrations with Drizzle..."
cd backend && npx drizzle-kit push && cd ..

echo ""
echo "🎉 First-time setup complete!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "📖 Next steps:"
echo "   - Update your API keys and DB/Redis info in the .env file if needed."
echo "   - Run 'npm run dev' from the root to start both backend and frontend."
echo "   - Visit http://localhost:3000 to start using the app."
echo "   - To open Drizzle Studio, run: npm run db:studio"
echo "   - To re-run migrations, run: npm run db:migrate"
echo "" 