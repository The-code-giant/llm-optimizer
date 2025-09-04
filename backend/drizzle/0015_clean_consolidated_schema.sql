-- Clean migration for consolidated content schema
-- This migration only adds the new tables we need

-- Create enums if they don't exist
DO $$ BEGIN
    CREATE TYPE content_source AS ENUM('ai_generated', 'manual', 'imported');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_status AS ENUM('draft', 'active', 'deployed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM('title', 'description', 'faq', 'paragraph', 'keywords', 'schema', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create unified_content table
CREATE TABLE IF NOT EXISTS unified_content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES pages(id),
    site_id uuid NOT NULL REFERENCES sites(id),
    content_type content_type NOT NULL,
    content_source content_source NOT NULL DEFAULT 'ai_generated',
    status content_status NOT NULL DEFAULT 'draft',
    name varchar(255),
    original_content text,
    optimized_content text NOT NULL,
    metadata jsonb DEFAULT '{}',
    ai_model varchar(128),
    generation_context text,
    generation_prompt text,
    version integer DEFAULT 1,
    is_active integer DEFAULT 0,
    deployed_at timestamp,
    deployed_by varchar(255),
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Create section_analysis table
CREATE TABLE IF NOT EXISTS section_analysis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES pages(id),
    analysis_result_id uuid NOT NULL REFERENCES analysis_results(id),
    section_type varchar(64) NOT NULL,
    current_score double precision NOT NULL,
    max_score double precision DEFAULT 10,
    previous_score double precision,
    issues jsonb DEFAULT '[]',
    recommendations jsonb DEFAULT '[]',
    priority priority DEFAULT 'medium',
    estimated_impact double precision DEFAULT 0,
    ai_model varchar(128),
    analysis_context text,
    confidence double precision DEFAULT 0,
    improvement_count integer DEFAULT 0,
    last_improved_at timestamp,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Create content_deployments_new table
CREATE TABLE IF NOT EXISTS content_deployments_new (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id uuid NOT NULL REFERENCES pages(id),
    content_id uuid NOT NULL REFERENCES unified_content(id),
    section_type varchar(64) NOT NULL,
    previous_score double precision NOT NULL,
    new_score double precision NOT NULL,
    score_improvement double precision NOT NULL,
    deployed_content text NOT NULL,
    deployment_method varchar(64) DEFAULT 'manual',
    ai_model varchar(128),
    deployed_by varchar(255),
    is_validated integer DEFAULT 0,
    validation_results jsonb DEFAULT '{}',
    test_results jsonb DEFAULT '{}',
    deployed_at timestamp DEFAULT now(),
    created_at timestamp DEFAULT now()
);

-- Create content_relationships table
CREATE TABLE IF NOT EXISTS content_relationships (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_content_id uuid NOT NULL REFERENCES unified_content(id),
    child_content_id uuid NOT NULL REFERENCES unified_content(id),
    relationship_type varchar(64) NOT NULL,
    metadata jsonb DEFAULT '{}',
    "order" integer DEFAULT 0,
    created_at timestamp DEFAULT now()
);

-- Create content_performance table
CREATE TABLE IF NOT EXISTS content_performance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES unified_content(id),
    page_id uuid NOT NULL REFERENCES pages(id),
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    engagement double precision DEFAULT 0,
    ranking_position integer,
    search_volume integer,
    click_through_rate double precision,
    llm_citations integer DEFAULT 0,
    llm_ranking double precision,
    period_start timestamp NOT NULL,
    period_end timestamp NOT NULL,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS unified_content_page_type_idx 
ON unified_content(page_id, content_type, status) 
WHERE status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS unified_content_site_idx 
ON unified_content(site_id, content_type);

CREATE UNIQUE INDEX IF NOT EXISTS section_analysis_page_section_idx 
ON section_analysis(page_id, section_type);

CREATE UNIQUE INDEX IF NOT EXISTS section_analysis_analysis_idx 
ON section_analysis(analysis_result_id);

CREATE UNIQUE INDEX IF NOT EXISTS content_deployments_new_page_idx 
ON content_deployments_new(page_id);

CREATE UNIQUE INDEX IF NOT EXISTS content_deployments_new_content_idx 
ON content_deployments_new(content_id);

CREATE UNIQUE INDEX IF NOT EXISTS content_relationships_parent_idx 
ON content_relationships(parent_content_id);

CREATE UNIQUE INDEX IF NOT EXISTS content_relationships_child_idx 
ON content_relationships(child_content_id);

CREATE UNIQUE INDEX IF NOT EXISTS content_performance_content_idx 
ON content_performance(content_id);

CREATE UNIQUE INDEX IF NOT EXISTS content_performance_page_idx 
ON content_performance(page_id);


