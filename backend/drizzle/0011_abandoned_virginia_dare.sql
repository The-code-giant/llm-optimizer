ALTER TABLE "sites" DROP CONSTRAINT "sites_knowledge_base_id_site_knowledge_bases_id_fk";
--> statement-breakpoint
ALTER TABLE "sites" DROP COLUMN IF EXISTS "knowledge_base_id";