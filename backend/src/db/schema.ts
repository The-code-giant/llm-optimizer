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
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";



export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }),
  preferences: jsonb("preferences").default({}),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sites = pgTable("sites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  trackerId: uuid("tracker_id").notNull().unique(),
  status: varchar("status", { length: 32 }).notNull(),
  settings: jsonb("settings").default({}),
  // Cached metrics for performance
  averageLLMScore: doublePrecision("average_llm_score"), // Cached average of all page scores
  totalPages: integer("total_pages").default(0), // Count of pages for faster calculations
  pagesWithScores: integer("pages_with_scores").default(0), // Count of analyzed pages
  lastMetricsUpdate: timestamp("last_metrics_update"), // When metrics were last calculated
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Partial unique index that only applies to non-deleted sites
  urlUnique: uniqueIndex("sites_url_unique").on(table.url).where(sql`${table.deletedAt} IS NULL`),
  // Performance indexes for frequent queries
  userIdIdx: index("sites_user_id_idx").on(table.userId),
  userIdCreatedAtIdx: index("sites_user_created_idx").on(table.userId, table.createdAt),
  trackerIdIdx: index("sites_tracker_id_idx").on(table.trackerId),
}));

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  url: varchar("url", { length: 1024 }).notNull(),
  title: varchar("title", { length: 512 }),
  contentSnapshot: text("content_snapshot"),
  lastScannedAt: timestamp("last_scanned_at"),
  lastAnalysisAt: timestamp("last_analysis_at"),
  llmReadinessScore: doublePrecision("llm_readiness_score"), // Legacy field for compatibility
  pageScore: doublePrecision("page_score"), // Cached overall score (0-100) from section ratings
  lastScoreUpdate: timestamp("last_score_update"), // When score was last calculated
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  siteIdIdx: index("pages_site_id_idx").on(table.siteId),
  siteIdUrlIdx: index("pages_site_url_idx").on(table.siteId, table.url),
  siteIdAnalysisIdx: index("pages_site_analysis_idx").on(table.siteId, table.lastAnalysisAt),
  urlIdx: index("pages_url_idx").on(table.url),
}));

export const contentAnalysis = pgTable("content_analysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),
  
  // Core analysis data
  overallScore: doublePrecision("overall_score").notNull(), // 0-100 overall page score
  analyzedAt: timestamp("analyzed_at").defaultNow(),
  llmModelUsed: varchar("llm_model_used", { length: 128 }).notNull(),
  
  // AI-generated summaries
  pageSummary: text("page_summary"), // AI-generated page summary
  analysisSummary: text("analysis_summary"), // AI-generated analysis summary
  
  // Content quality metrics (normalized from JSON)
  contentClarity: doublePrecision("content_clarity").default(0), // 0-100
  contentStructure: doublePrecision("content_structure").default(0), // 0-100
  contentCompleteness: doublePrecision("content_completeness").default(0), // 0-100
  
  // Technical SEO metrics (normalized from JSON)
  titleOptimization: doublePrecision("title_optimization").default(0), // 0-100
  metaDescription: doublePrecision("meta_description").default(0), // 0-100
  headingStructure: doublePrecision("heading_structure").default(0), // 0-100
  schemaMarkup: doublePrecision("schema_markup").default(0), // 0-100
  
  // Keyword analysis (normalized from JSON)
  primaryKeywords: jsonb("primary_keywords").default([]), // Array of primary keywords
  longTailKeywords: jsonb("long_tail_keywords").default([]), // Array of long-tail keywords
  keywordDensity: doublePrecision("keyword_density").default(0), // 0-100
  semanticKeywords: jsonb("semantic_keywords").default([]), // Array of semantic keywords
  
  // LLM optimization metrics (normalized from JSON)
  definitionsPresent: integer("definitions_present").default(0), // 0 or 1
  faqsPresent: integer("faqs_present").default(0), // 0 or 1
  structuredData: integer("structured_data").default(0), // 0 or 1
  citationFriendly: integer("citation_friendly").default(0), // 0 or 1
  topicCoverage: doublePrecision("topic_coverage").default(0), // 0-100
  answerableQuestions: doublePrecision("answerable_questions").default(0), // 0-100
  
  // Analysis metadata
  confidence: doublePrecision("confidence").default(0), // AI confidence score 0-1
  analysisVersion: varchar("analysis_version", { length: 32 }).default("1.0"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  pageIdIdx: index("content_analysis_page_id_idx").on(table.pageId),
  pageIdCreatedAtIdx: index("content_analysis_page_created_idx").on(table.pageId, table.createdAt),
}));

// New table for content-based ratings
export const contentRatings = pgTable("content_ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),
  analysisResultId: uuid("analysis_result_id")
    .notNull()
    .references(() => contentAnalysis.id),
  sectionType: varchar("section_type", { length: 64 }).notNull(), // 'title', 'description', 'headings', 'content', 'schema', 'images', 'links'
  currentScore: doublePrecision("current_score").notNull(), // 0-10 score for this section
  maxScore: doublePrecision("max_score").default(10), // Maximum possible score (default 10)
  previousScore: doublePrecision("previous_score"), // Previous score before improvement
  improvementCount: integer("improvement_count").default(0), // How many times this section was improved
  lastImprovedAt: timestamp("last_improved_at"), // When this section was last improved
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  pageIdIdx: index("content_ratings_page_id_idx").on(table.pageId),
  analysisResultIdIdx: index("content_ratings_analysis_id_idx").on(table.analysisResultId),
  pageIdCreatedAtIdx: index("content_ratings_page_created_idx").on(table.pageId, table.createdAt),
}));

// New table for content-specific recommendations
export const contentRecommendations = pgTable("content_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),
  analysisResultId: uuid("analysis_result_id")
    .notNull()
    .references(() => contentAnalysis.id),
  sectionType: varchar("section_type", { length: 64 }).notNull(), // 'title', 'description', 'headings', 'content', 'schema', 'images', 'links'
  recommendations: jsonb("recommendations").notNull(), // Array of specific recommendations for this section
  priority: varchar("priority", { length: 32 }).default('medium'), // 'low', 'medium', 'high', 'critical'
  estimatedImpact: doublePrecision("estimated_impact").default(0), // Estimated score improvement (0-10)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  pageIdIdx: index("content_recommendations_page_id_idx").on(table.pageId),
  analysisResultIdIdx: index("content_recommendations_analysis_id_idx").on(table.analysisResultId),
  analysisResultIdCreatedAtIdx: index("content_recommendations_analysis_created_idx").on(table.analysisResultId, table.createdAt),
}));

// New table for tracking content deployments and score improvements
export const contentDeployments = pgTable("content_deployments", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),
  sectionType: varchar("section_type", { length: 64 }).notNull(), // Which section was improved
  previousScore: doublePrecision("previous_score").notNull(), // Score before deployment
  newScore: doublePrecision("new_score").notNull(), // Score after deployment
  scoreImprovement: doublePrecision("score_improvement").notNull(), // How much the score improved
  deployedContent: text("deployed_content").notNull(), // The actual content that was deployed
  aiModel: varchar("ai_model", { length: 128 }), // Which AI model generated the content
  deployedBy: varchar("deployed_by", { length: 255 }), // User ID who deployed it
  status: varchar("status", { length: 32 }).default("deployed").notNull(), // 'deployed', 'draft', 'archived'
  isActive: integer("is_active").default(1).notNull(), // 1 = active, 0 = inactive (replaced by newer deployment)
  deployedAt: timestamp("deployed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Indexes for performance
  pageIdIdx: index("content_deployments_page_id_idx").on(table.pageId),
  pageIdDeployedAtIdx: index("content_deployments_page_deployed_idx").on(table.pageId, table.deployedAt),
  pageIdSectionActiveIdx: index("content_deployments_page_section_active_idx").on(table.pageId, table.sectionType, table.isActive),
}));



export const trackerData = pgTable("tracker_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  pageUrl: varchar("page_url", { length: 1024 }),
  eventType: varchar("event_type", { length: 64 }),
  timestamp: timestamp("timestamp").defaultNow(),
  sessionId: varchar("session_id", { length: 255 }),
  anonymousUserId: varchar("anonymous_user_id", { length: 255 }),
  // New columns for enhanced tracking
  eventData: jsonb("event_data"),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }), // IPv6 max length
  referrer: varchar("referrer", { length: 1024 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  siteIdIdx: index("tracker_data_site_id_idx").on(table.siteId),
  siteIdTimestampIdx: index("tracker_data_site_timestamp_idx").on(table.siteId, table.timestamp),
  timestampIdx: index("tracker_data_timestamp_idx").on(table.timestamp),
}));

export const contentSuggestions = pgTable("content_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id),
  contentType: varchar("content_type", { length: 64 }).notNull(),
  suggestions: jsonb("suggestions").notNull(), // Array of suggestions from AI
  requestContext: text("request_context"), // Additional context provided by user
  aiModel: varchar("ai_model", { length: 128 }),
  generatedAt: timestamp("generated_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration for suggestion caching
}, (table) => ({
  // Performance indexes for frequent queries
  pageIdIdx: index("content_suggestions_page_id_idx").on(table.pageId),
  pageIdGeneratedAtIdx: index("content_suggestions_page_generated_idx").on(table.pageId, table.generatedAt),
}));

export const pageAnalytics = pgTable("page_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  pageUrl: varchar("page_url", { length: 1024 }).notNull(),
  visitDate: varchar("visit_date", { length: 10 }).notNull(), // YYYY-MM-DD format
  pageViews: integer("page_views").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  bounceRate: doublePrecision("bounce_rate"),
  avgSessionDuration: integer("avg_session_duration"), // seconds
  loadTimeMs: integer("load_time_ms"),
  contentInjected: integer("content_injected").default(0), // 0 or 1 for boolean
  contentTypesInjected: jsonb("content_types_injected").default([]), // Array of content types
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  siteIdIdx: index("page_analytics_site_id_idx").on(table.siteId),
  siteIdPageViewsIdx: index("page_analytics_site_views_idx").on(table.siteId, table.pageViews),
  pageUrlIdx: index("page_analytics_page_url_idx").on(table.pageUrl),
}));

export const subscriptionTypeEnum = pgEnum("subscription_type", [
  "free",
  "pro",
  "enterprise",
]);

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionType: subscriptionTypeEnum("subscription_type").default("free"),
  isActive: integer("is_active").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Performance indexes for frequent queries
  userIdIdx: index("user_subscriptions_user_id_idx").on(table.userId),
  userIdCreatedAtIdx: index("user_subscriptions_user_created_idx").on(table.userId, table.createdAt),
}));

// Leads captured from public tools/forms
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  website: varchar("website", { length: 1024 }).notNull(),
  source: varchar("source", { length: 64 }).default("tools"),
  userAgent: varchar("user_agent", { length: 500 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  meta: jsonb("meta").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

