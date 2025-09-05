CREATE TABLE IF NOT EXISTS "content_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"analysis_result_id" uuid NOT NULL,
	"section_type" varchar(64) NOT NULL,
	"recommendations" jsonb NOT NULL,
	"priority" varchar(32) DEFAULT 'medium',
	"estimated_impact" double precision DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "section_recommendations" CASCADE;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_analysis_result_id_analysis_results_id_fk" FOREIGN KEY ("analysis_result_id") REFERENCES "public"."analysis_results"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
