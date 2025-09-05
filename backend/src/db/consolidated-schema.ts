import {
  pgTable,
  serial,
  uuid,
  varchar,
  text,
  timestamp,
  doublePrecision,
  jsonb,
  primaryKey,
  integer,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ============================================================================
// CONSOLIDATED CONTENT MANAGEMENT SCHEMA
// ============================================================================
// This schema consolidates the redundant tables into a unified content management system
// that handles both AI-generated recommendations and manual content injection

// Content type enum for better type safety
export const contentTypeEnum = pgEnum("content_type", [
  "title",
  "description", 
  "faq",
  "paragraph",
  "keywords",
  "schema",
  "custom" // For manually created content
]);

// Content status enum
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "active", 
  "deployed",
  "archived"
]);

// Content source enum
export const contentSourceEnum = pgEnum("content_source", [
  "ai_generated",
  "manual",
  "imported"
]);

// Priority enum for recommendations
export const priorityEnum = pgEnum("priority", [
  "low",
  "medium", 
  "high",
  "critical"
]);

// ============================================================================
// UNIFIED CONTENT TABLE
// ============================================================================
// Replaces: injected_content, page_content, content_suggestions
export const unifiedContent = pgTable("unified_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Core identification
  pageId: uuid("page_id").notNull(), // References pages.id
  siteId: uuid("site_id").notNull(), // References sites.id (for performance)
  
  // Content details
  contentType: contentTypeEnum("content_type").notNull(),
  contentSource: contentSourceEnum("content_source").notNull().default("ai_generated"),
  status: contentStatusEnum("status").notNull().default("draft"),
  
  // Content data
  name: varchar("name", { length: 255 }), // For custom content
  originalContent: text("original_content"), // Original content before optimization
  optimizedContent: text("optimized_content").notNull(), // The actual content
  metadata: jsonb("metadata").default({}), // Additional data (keywords, character counts, etc.)
  
  // AI generation details
  aiModel: varchar("ai_model", { length: 128 }),
  generationContext: text("generation_context"), // Context used for generation
  generationPrompt: text("generation_prompt"), // The actual prompt used
  
  // Versioning and deployment
  version: integer("version").default(1),
  isActive: integer("is_active").default(0), // 0 = draft, 1 = deployed
  deployedAt: timestamp("deployed_at"),
  deployedBy: varchar("deployed_by", { length: 255 }), // User ID who deployed it
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for performance
  pageContentTypeIdx: uniqueIndex("unified_content_page_type_idx").on(
    table.pageId, 
    table.contentType, 
    table.status
  ).where(sql`${table.status} = 'active'`),
  siteContentIdx: uniqueIndex("unified_content_site_idx").on(table.siteId, table.contentType),
}));

// ============================================================================
// ENHANCED SECTION ANALYSIS TABLE
// ============================================================================
// Replaces: page_section_ratings, section_recommendations
export const sectionAnalysis = pgTable("section_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Core identification
  pageId: uuid("page_id").notNull(), // References pages.id
  analysisResultId: uuid("analysis_result_id").notNull(), // References analysis_results.id
  
  // Section details
  sectionType: varchar("section_type", { length: 64 }).notNull(), // 'title', 'description', etc.
  
  // AI Analysis results
  currentScore: doublePrecision("current_score").notNull(), // 0-10 score
  maxScore: doublePrecision("max_score").default(10),
  previousScore: doublePrecision("previous_score"), // For tracking improvements
  
  // AI-generated recommendations
  issues: jsonb("issues").default([]), // Array of identified issues
  recommendations: jsonb("recommendations").default([]), // Array of AI recommendations
  priority: priorityEnum("priority").default("medium"),
  estimatedImpact: doublePrecision("estimated_impact").default(0), // Expected improvement
  
  // Analysis metadata
  aiModel: varchar("ai_model", { length: 128 }),
  analysisContext: text("analysis_context"), // Context used for analysis
  confidence: doublePrecision("confidence").default(0), // AI confidence in analysis
  
  // Tracking
  improvementCount: integer("improvement_count").default(0),
  lastImprovedAt: timestamp("last_improved_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for performance
  pageSectionIdx: uniqueIndex("section_analysis_page_section_idx").on(
    table.pageId, 
    table.sectionType
  ),
  analysisIdx: uniqueIndex("section_analysis_analysis_idx").on(table.analysisResultId),
}));

// ============================================================================
// CONTENT DEPLOYMENT TRACKING TABLE
// ============================================================================
// Enhanced version of content_deployments with better tracking
export const contentDeployments = pgTable("content_deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Core identification
  pageId: uuid("page_id").notNull(), // References pages.id
  contentId: uuid("content_id").notNull(), // References unified_content.id
  sectionType: varchar("section_type", { length: 64 }).notNull(),
  
  // Score tracking
  previousScore: doublePrecision("previous_score").notNull(),
  newScore: doublePrecision("new_score").notNull(),
  scoreImprovement: doublePrecision("score_improvement").notNull(),
  
  // Deployment details
  deployedContent: text("deployed_content").notNull(),
  deploymentMethod: varchar("deployment_method", { length: 64 }).default("manual"), // 'manual', 'api', 'automated'
  aiModel: varchar("ai_model", { length: 128 }),
  deployedBy: varchar("deployed_by", { length: 255 }),
  
  // Validation and testing
  isValidated: integer("is_validated").default(0), // 0 = not validated, 1 = validated
  validationResults: jsonb("validation_results").default({}),
  testResults: jsonb("test_results").default({}),
  
  // Timestamps
  deployedAt: timestamp("deployed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Indexes for performance
  pageDeploymentIdx: uniqueIndex("content_deployments_page_idx").on(table.pageId),
  contentDeploymentIdx: uniqueIndex("content_deployments_content_idx").on(table.contentId),
}));

// ============================================================================
// CONTENT RELATIONSHIPS TABLE
// ============================================================================
// For complex content relationships (e.g., FAQ questions linked to answers)
export const contentRelationships = pgTable("content_relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Relationship details
  parentContentId: uuid("parent_content_id").notNull(), // References unified_content.id
  childContentId: uuid("child_content_id").notNull(), // References unified_content.id
  relationshipType: varchar("relationship_type", { length: 64 }).notNull(), // 'faq_question_answer', 'related_content', etc.
  
  // Relationship metadata
  metadata: jsonb("metadata").default({}),
  order: integer("order").default(0), // For ordered relationships
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Indexes for performance
  parentIdx: uniqueIndex("content_relationships_parent_idx").on(table.parentContentId),
  childIdx: uniqueIndex("content_relationships_child_idx").on(table.childContentId),
}));

// ============================================================================
// CONTENT PERFORMANCE TRACKING TABLE
// ============================================================================
// Track how well deployed content performs
export const contentPerformance = pgTable("content_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Core identification
  contentId: uuid("content_id").notNull(), // References unified_content.id
  pageId: uuid("page_id").notNull(), // References pages.id
  
  // Performance metrics
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  engagement: doublePrecision("engagement").default(0), // Custom engagement score
  
  // SEO metrics
  rankingPosition: integer("ranking_position"),
  searchVolume: integer("search_volume"),
  clickThroughRate: doublePrecision("click_through_rate"),
  
  // LLM metrics (if trackable)
  llmCitations: integer("llm_citations").default(0),
  llmRanking: doublePrecision("llm_ranking"),
  
  // Time period
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Indexes for performance
  contentPerformanceIdx: uniqueIndex("content_performance_content_idx").on(table.contentId),
  pagePerformanceIdx: uniqueIndex("content_performance_page_idx").on(table.pageId),
}));

// ============================================================================
// MIGRATION NOTES
// ============================================================================
/*
MIGRATION STRATEGY:

1. **Phase 1: Create new tables**
   - Create unified_content, section_analysis, content_deployments, etc.
   - Keep old tables intact

2. **Phase 2: Data migration**
   - Migrate data from old tables to new unified structure
   - injected_content + page_injected_content → unified_content
   - content_suggestions → unified_content (with source='ai_generated')
   - page_content → unified_content (with source='ai_generated', status='deployed')
   - page_section_ratings + section_recommendations → section_analysis

3. **Phase 3: Update application code**
   - Update all routes and services to use new tables
   - Update frontend to work with new data structure

4. **Phase 4: Cleanup**
   - Drop old tables after verification
   - Update indexes and constraints

BENEFITS OF NEW SCHEMA:

1. **Unified Content Management**
   - Single table for all content types (AI-generated, manual, imported)
   - Consistent interface for content operations
   - Better content versioning and deployment tracking

2. **Enhanced AI Integration**
   - Better tracking of AI model usage and performance
   - Improved recommendation system with confidence scores
   - More detailed analysis context storage

3. **Performance Improvements**
   - Better indexing strategy
   - Reduced table joins
   - More efficient queries

4. **Scalability**
   - Support for content relationships
   - Performance tracking capabilities
   - Better content lifecycle management

5. **Data Integrity**
   - Stronger type safety with enums
   - Better constraint management
   - Improved data validation
*/


