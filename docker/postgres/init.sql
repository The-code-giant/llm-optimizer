-- Clever Search Database Initialization Script
-- This script sets up the development database with proper configurations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create development database if it doesn't exist
-- Note: This is mainly for documentation as the database is created via environment variables

-- Set timezone
SET timezone = 'UTC';

-- Create initial admin user (optional for development)
-- This will be handled by the application migrations via Drizzle 