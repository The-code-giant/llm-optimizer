CREATE TABLE IF NOT EXISTS "content_analysis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"overall_score" double precision NOT NULL,
	"analyzed_at" timestamp DEFAULT now(),
	"llm_model_used" varchar(128) NOT NULL,
	"page_summary" text,
	"analysis_summary" text,
	"content_clarity" double precision DEFAULT 0,
	"content_structure" double precision DEFAULT 0,
	"content_completeness" double precision DEFAULT 0,
	"title_optimization" double precision DEFAULT 0,
	"meta_description" double precision DEFAULT 0,
	"heading_structure" double precision DEFAULT 0,
	"schema_markup" double precision DEFAULT 0,
	"primary_keywords" jsonb DEFAULT '[]'::jsonb,
	"long_tail_keywords" jsonb DEFAULT '[]'::jsonb,
	"keyword_density" double precision DEFAULT 0,
	"semantic_keywords" jsonb DEFAULT '[]'::jsonb,
	"definitions_present" integer DEFAULT 0,
	"faqs_present" integer DEFAULT 0,
	"structured_data" integer DEFAULT 0,
	"citation_friendly" integer DEFAULT 0,
	"topic_coverage" double precision DEFAULT 0,
	"answerable_questions" double precision DEFAULT 0,
	"confidence" double precision DEFAULT 0,
	"analysis_version" varchar(32) DEFAULT '1.0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "analysis_results" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "analysis_results" CASCADE;--> statement-breakpoint
ALTER TABLE "content_ratings" DROP CONSTRAINT "content_ratings_analysis_result_id_analysis_results_id_fk";
--> statement-breakpoint
ALTER TABLE "content_recommendations" DROP CONSTRAINT "content_recommendations_analysis_result_id_analysis_results_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_analysis" ADD CONSTRAINT "content_analysis_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_ratings" ADD CONSTRAINT "content_ratings_analysis_result_id_content_analysis_id_fk" FOREIGN KEY ("analysis_result_id") REFERENCES "public"."content_analysis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_analysis_result_id_content_analysis_id_fk" FOREIGN KEY ("analysis_result_id") REFERENCES "public"."content_analysis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
