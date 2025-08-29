-- Manual migration to properly handle content_analysis table creation
-- This handles the constraint issues from the previous migration

-- First, create the new content_analysis table
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

-- Add foreign key constraint to pages table
DO $$ BEGIN
    ALTER TABLE "content_analysis" ADD CONSTRAINT "content_analysis_page_id_pages_id_fk" 
    FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop the old analysis_results table if it exists
DROP TABLE IF EXISTS "analysis_results" CASCADE;

-- Update foreign key constraints for content_ratings
DO $$ BEGIN
    ALTER TABLE "content_ratings" DROP CONSTRAINT IF EXISTS "content_ratings_analysis_result_id_analysis_results_id_fk";
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "content_ratings" ADD CONSTRAINT "content_ratings_analysis_result_id_content_analysis_id_fk" 
    FOREIGN KEY ("analysis_result_id") REFERENCES "public"."content_analysis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update foreign key constraints for content_recommendations
DO $$ BEGIN
    ALTER TABLE "content_recommendations" DROP CONSTRAINT IF EXISTS "content_recommendations_analysis_result_id_analysis_results_id_fk";
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "content_recommendations" ADD CONSTRAINT "content_recommendations_analysis_result_id_content_analysis_id_fk" 
    FOREIGN KEY ("analysis_result_id") REFERENCES "public"."content_analysis"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


