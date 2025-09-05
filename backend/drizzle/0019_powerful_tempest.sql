ALTER TABLE "pages" ADD COLUMN "page_score" double precision;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "last_score_update" timestamp;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "average_llm_score" double precision;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "total_pages" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "pages_with_scores" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "last_metrics_update" timestamp;