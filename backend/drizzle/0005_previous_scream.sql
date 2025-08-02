ALTER TABLE "page_content" ALTER COLUMN "is_active" SET DEFAULT 0;--> statement-breakpoint
-- Skip adding columns as they already exist
-- ALTER TABLE "page_content" ADD COLUMN "deployed_at" timestamp;--> statement-breakpoint
-- ALTER TABLE "page_content" ADD COLUMN "deployed_by" varchar(255);