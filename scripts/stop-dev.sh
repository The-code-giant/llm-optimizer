#!/bin/bash

# Cleaver Search Development Environment Stop Script

echo "🛑 Stopping Cleaver Search Development Environment..."

# Stop all services
docker compose down

echo "✅ All services stopped."

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️  Removing volumes..."
# docker compose down -v
# echo "✅ Volumes removed." 