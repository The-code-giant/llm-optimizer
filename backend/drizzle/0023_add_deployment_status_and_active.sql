ALTER TABLE "content_deployments" ADD COLUMN "status" varchar(32) DEFAULT 'deployed' NOT NULL;--> statement-breakpoint
ALTER TABLE "content_deployments" ADD COLUMN "is_active" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_deployments_page_section_active_idx" ON "content_deployments" USING btree ("page_id","section_type","is_active");