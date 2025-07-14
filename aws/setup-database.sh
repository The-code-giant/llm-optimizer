#!/bin/bash
set -e

echo "🗄️ Setting up database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec postgres_prod pg_isready -U postgres -d cleaver_search_dev; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Copy migration files to container
echo "📂 Copying migration files..."
tar -czf migrations.tar.gz -C /home/ec2-user drizzle/
docker cp migrations.tar.gz backend_prod:/app/
docker exec backend_prod tar -xzf /app/migrations.tar.gz -C /app/

# Run migrations in order
echo "🔄 Running database migrations..."

# Base migration
echo "📋 Running base migration (0000)..."
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD postgres_prod psql -U postgres -d cleaver_search_dev -f /dev/stdin << 'MIGRATION_0000'
CREATE TABLE IF NOT EXISTS "analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"analyzed_at" timestamp DEFAULT now(),
	"llm_model_used" varchar(128),
	"score" double precision,
	"recommendations" jsonb,
	"raw_llm_output" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "injected_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(64) NOT NULL,
	"content" text,
	"status" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "page_injected_content" (
	"page_id" uuid NOT NULL,
	"injected_content_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "page_injected_content_page_id_injected_content_id_pk" PRIMARY KEY("page_id","injected_content_id")
);

CREATE TABLE IF NOT EXISTS "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"url" varchar(1024) NOT NULL,
	"title" varchar(512),
	"content_snapshot" text,
	"last_scanned_at" timestamp,
	"last_analysis_at" timestamp,
	"llm_readiness_score" double precision,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" varchar(512) NOT NULL,
	"tracker_id" uuid NOT NULL,
	"status" varchar(32) NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sites_url_unique" UNIQUE("url"),
	CONSTRAINT "sites_tracker_id_unique" UNIQUE("tracker_id")
);

CREATE TABLE IF NOT EXISTS "tracker_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"page_url" varchar(1024),
	"event_type" varchar(64),
	"timestamp" timestamp DEFAULT now(),
	"session_id" varchar(255),
	"anonymous_user_id" varchar(255),
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255),
	"name" varchar(255),
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

-- Foreign key constraints
DO $$ BEGIN
 ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "injected_content" ADD CONSTRAINT "injected_content_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "page_injected_content" ADD CONSTRAINT "page_injected_content_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "page_injected_content" ADD CONSTRAINT "page_injected_content_injected_content_id_injected_content_id_fk" FOREIGN KEY ("injected_content_id") REFERENCES "public"."injected_content"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "sites" ADD CONSTRAINT "sites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tracker_data" ADD CONSTRAINT "tracker_data_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
MIGRATION_0000

# Additional migrations
echo "📋 Running additional migrations..."
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD postgres_prod psql -U postgres -d cleaver_search_dev -c "
-- Additional tables from later migrations
CREATE TABLE IF NOT EXISTS content_suggestions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	page_id uuid NOT NULL REFERENCES pages(id),
	content_type varchar(64) NOT NULL,
	suggestions jsonb NOT NULL,
	request_context text,
	ai_model varchar(128),
	generated_at timestamp DEFAULT now(),
	expires_at timestamp
);

CREATE TABLE IF NOT EXISTS page_analytics (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	site_id uuid NOT NULL REFERENCES sites(id),
	page_url varchar(1024) NOT NULL,
	visit_date varchar(10) NOT NULL,
	page_views integer DEFAULT 0,
	unique_visitors integer DEFAULT 0,
	bounce_rate double precision,
	avg_session_duration integer,
	load_time_ms integer,
	content_injected integer DEFAULT 0,
	content_types_injected jsonb DEFAULT '[]'::jsonb,
	created_at timestamp DEFAULT now(),
	updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_content (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	page_id uuid NOT NULL REFERENCES pages(id),
	content_type varchar(64) NOT NULL,
	original_content text,
	optimized_content text NOT NULL,
	ai_model varchar(128),
	generation_context text,
	is_active integer DEFAULT 0,
	version integer DEFAULT 1,
	metadata jsonb DEFAULT '{}'::jsonb,
	page_url varchar(1024),
	deployed_at timestamp,
	deployed_by varchar(255),
	created_at timestamp DEFAULT now(),
	updated_at timestamp DEFAULT now()
);

-- Add any missing columns to tracker_data
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS event_data jsonb;
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS user_agent varchar(500);
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS ip_address varchar(45);
ALTER TABLE tracker_data ADD COLUMN IF NOT EXISTS referrer varchar(1024);
"

echo "✅ Database migrations completed successfully!"

# Verify tables exist
echo "🔍 Verifying database schema..."
docker exec -e PGPASSWORD=$POSTGRES_PASSWORD postgres_prod psql -U postgres -d cleaver_search_dev -c "\dt"

echo "✅ Database setup complete!"
