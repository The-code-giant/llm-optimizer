-- Add name and preferences fields to users table
ALTER TABLE "users" ADD COLUMN "name" varchar(255);
ALTER TABLE "users" ADD COLUMN "preferences" jsonb DEFAULT '{}'; 