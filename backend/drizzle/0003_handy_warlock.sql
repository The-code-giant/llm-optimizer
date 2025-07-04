CREATE TABLE IF NOT EXISTS "page_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"page_url" varchar(1024) NOT NULL,
	"visit_date" varchar(10) NOT NULL,
	"page_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"bounce_rate" double precision,
	"avg_session_duration" integer,
	"load_time_ms" integer,
	"content_injected" integer DEFAULT 0,
	"content_types_injected" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "page_content" ADD COLUMN "page_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "tracker_data" ADD COLUMN "event_data" jsonb;--> statement-breakpoint
ALTER TABLE "tracker_data" ADD COLUMN "user_agent" varchar(500);--> statement-breakpoint
ALTER TABLE "tracker_data" ADD COLUMN "ip_address" varchar(45);--> statement-breakpoint
ALTER TABLE "tracker_data" ADD COLUMN "referrer" varchar(1024);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "page_analytics" ADD CONSTRAINT "page_analytics_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
