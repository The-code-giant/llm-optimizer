-- Drop foreign key constraints first
ALTER TABLE "sites" DROP CONSTRAINT IF EXISTS "sites_user_id_users_id_fk";
ALTER TABLE "pages" DROP CONSTRAINT IF EXISTS "pages_site_id_sites_id_fk";
ALTER TABLE "analysis_results" DROP CONSTRAINT IF EXISTS "analysis_results_page_id_pages_id_fk";
ALTER TABLE "injected_content" DROP CONSTRAINT IF EXISTS "injected_content_site_id_sites_id_fk";
ALTER TABLE "page_injected_content" DROP CONSTRAINT IF EXISTS "page_injected_content_page_id_pages_id_fk";
ALTER TABLE "page_injected_content" DROP CONSTRAINT IF EXISTS "page_injected_content_injected_content_id_injected_content_id_fk";
ALTER TABLE "tracker_data" DROP CONSTRAINT IF EXISTS "tracker_data_site_id_sites_id_fk";

-- Change column types
ALTER TABLE "users" ALTER COLUMN "id" TYPE varchar(255);
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "sites" ALTER COLUMN "user_id" TYPE varchar(255);

-- Drop password_hash column as we're using Clerk
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";

-- Recreate foreign key constraints
ALTER TABLE "sites" ADD CONSTRAINT "sites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "injected_content" ADD CONSTRAINT "injected_content_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "page_injected_content" ADD CONSTRAINT "page_injected_content_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "page_injected_content" ADD CONSTRAINT "page_injected_content_injected_content_id_injected_content_id_fk" FOREIGN KEY ("injected_content_id") REFERENCES "injected_content"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tracker_data" ADD CONSTRAINT "tracker_data_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;