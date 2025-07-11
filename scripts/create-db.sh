#!/bin/bash

# Database Creation Script for Clever Search

echo "🗄️ Checking database setup..."

# Check if database exists
DB_EXISTS=$(docker compose exec postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw cleaver_search_dev; echo $?)

if [ $DB_EXISTS -eq 0 ]; then
    echo "✅ Database 'cleaver_search_dev' already exists"
else
    echo "📝 Creating database 'cleaver_search_dev'..."
    docker compose exec postgres psql -U postgres -c "CREATE DATABASE cleaver_search_dev;"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database 'cleaver_search_dev' created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

echo "🔧 Database setup complete" 