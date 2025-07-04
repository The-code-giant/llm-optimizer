-- Migration: 0003_tracker_enhancements.sql
-- Add JavaScript tracker functionality to existing schema

-- 1. Enhance page_content table for URL-based lookup
ALTER TABLE "page_content" ADD COLUMN "page_url" varchar(1024);

-- Update existing page_content records with URLs from pages table
UPDATE "page_content" SET "page_url" = (
  SELECT "url" FROM "pages" WHERE "pages"."id" = "page_content"."page_id"
);

-- Add index for fast URL-based content lookup
CREATE INDEX "idx_page_content_url_active" ON "page_content"("page_url", "content_type", "is_active");

-- 2. Create page_analytics table for detailed tracking
CREATE TABLE "page_analytics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "site_id" uuid NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
  "page_url" varchar(1024) NOT NULL,
  "visit_date" date NOT NULL,
  "page_views" integer DEFAULT 0,
  "unique_visitors" integer DEFAULT 0,
  "bounce_rate" numeric(5,2),
  "avg_session_duration" integer, -- seconds
  "load_time_ms" integer,
  "content_injected" boolean DEFAULT false,
  "content_types_injected" text[], -- Array of content types injected
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  
  -- Unique constraint to prevent duplicate analytics for same site/url/date
  CONSTRAINT "unique_site_url_date" UNIQUE("site_id", "page_url", "visit_date")
);

-- Add indexes for analytics table
CREATE INDEX "idx_analytics_site_date" ON "page_analytics"("site_id", "visit_date");
CREATE INDEX "idx_analytics_url" ON "page_analytics"("page_url");

-- 3. Enhance tracker_data table with detailed tracking
ALTER TABLE "tracker_data" ADD COLUMN "event_data" jsonb;
ALTER TABLE "tracker_data" ADD COLUMN "user_agent" varchar(500);
ALTER TABLE "tracker_data" ADD COLUMN "ip_address" inet;
ALTER TABLE "tracker_data" ADD COLUMN "referrer" varchar(1024);

-- Add indexes for better tracker_data performance
CREATE INDEX "idx_tracker_data_site_time" ON "tracker_data"("site_id", "timestamp");
CREATE INDEX "idx_tracker_data_event_type" ON "tracker_data"("event_type");
CREATE INDEX "idx_tracker_data_session" ON "tracker_data"("session_id"); 