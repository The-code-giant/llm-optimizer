# Cleversearch Infrastructure Update (July 2025)

**Docker is no longer used for local development or deployment.**

## Key Changes
- All Docker Compose files and Dockerfiles have been removed from the repository.
- The project now uses **Neon serverless PostgreSQL** and an **external Redis instance** (e.g., hosted on your EC2 server).
- All services (backend, frontend) are run directly on your machine or server, not in containers.
- No local Postgres or Redis containers are required or supported.

## Environment Setup
- Update your `.env` file with your Neon PostgreSQL and EC2 Redis connection details.
- Make sure your backend and frontend read these environment variables for DB and Redis connections.

## Migration Notes (for users upgrading from Docker)
- Remove any local Docker containers and volumes related to this project.
- Delete any `.env` or config files referencing local Postgres/Redis containers.
- Use your Neon and Redis connection strings in all environments.

## Running the Project
- Start your backend and frontend using their respective npm/yarn scripts (e.g., `npm run dev` in each directory).
- Ensure your Neon DB and EC2 Redis are running and accessible from your development and production environments.

## Deployment
- Deploy backend and frontend directly to your server (e.g., EC2) using your preferred process (PM2, systemd, etc.).
- No container orchestration is required.

---
**Last Updated:** July 2025 