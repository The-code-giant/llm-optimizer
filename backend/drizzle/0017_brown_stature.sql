CREATE TABLE IF NOT EXISTS "content_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"analysis_result_id" uuid NOT NULL,
	"section_type" varchar(64) NOT NULL,
	"current_score" double precision NOT NULL,
	"max_score" double precision DEFAULT 10,
	"previous_score" double precision,
	"improvement_count" integer DEFAULT 0,
	"last_improved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "page_section_ratings" CASCADE;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_ratings" ADD CONSTRAINT "content_ratings_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_ratings" ADD CONSTRAINT "content_ratings_analysis_result_id_analysis_results_id_fk" FOREIGN KEY ("analysis_result_id") REFERENCES "public"."analysis_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
