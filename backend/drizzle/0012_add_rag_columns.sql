-- Add RAG-related columns to sites table
ALTER TABLE "sites" ADD COLUMN "business_intelligence" jsonb DEFAULT '{}';
ALTER TABLE "sites" ADD COLUMN "rag_enabled" boolean DEFAULT false;
ALTER TABLE "sites" ADD COLUMN "brand_voice" jsonb DEFAULT '{}';
ALTER TABLE "sites" ADD COLUMN "target_audience" jsonb DEFAULT '{}';
ALTER TABLE "sites" ADD COLUMN "services_summary" jsonb DEFAULT '[]'; 