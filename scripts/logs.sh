#!/bin/bash

# Clever Search Development Environment Logs Script

SERVICE=${1:-""}

if [ -z "$SERVICE" ]; then
    echo "📋 Available services:"
    echo "  - backend"
    echo "  - frontend"
    echo "  - postgres"
    echo "  - redis"
    echo "  - all (default)"
    echo ""
    echo "Usage: ./scripts/logs.sh [service_name]"
    echo "Example: ./scripts/logs.sh backend"
    echo ""
    echo "Showing logs for all services..."
    docker compose logs -f
else
    echo "📋 Showing logs for: $SERVICE"
    docker compose logs -f $SERVICE
fi 