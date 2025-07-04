import { pgTable, serial, uuid, varchar, text, timestamp, doublePrecision, jsonb, primaryKey, integer, date, decimal, boolean, inet } from 'drizzle-orm/pg-core';

// Existing tables (no changes needed)
export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 512 }).notNull().unique(),
  trackerId: uuid('tracker_id').notNull().unique(), // ✅ Perfect for JS tracker authentication
  status: varchar('status', { length: 32 }).notNull(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  url: varchar('url', { length: 1024 }).notNull(),
  title: varchar('title', { length: 512 }),
  contentSnapshot: text('content_snapshot'),
  lastScannedAt: timestamp('last_scanned_at'),
  lastAnalysisAt: timestamp('last_analysis_at'),
  llmReadinessScore: doublePrecision('llm_readiness_score'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const analysisResults = pgTable('analysis_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id),
  analyzedAt: timestamp('analyzed_at').defaultNow(),
  llmModelUsed: varchar('llm_model_used', { length: 128 }),
  score: doublePrecision('score'),
  recommendations: jsonb('recommendations'),
  rawLlmOutput: text('raw_llm_output'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const injectedContent = pgTable('injected_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 64 }).notNull(),
  content: text('content'),
  status: varchar('status', { length: 32 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pageInjectedContent = pgTable('page_injected_content', {
  pageId: uuid('page_id').notNull().references(() => pages.id),
  injectedContentId: uuid('injected_content_id').notNull().references(() => injectedContent.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.pageId, table.injectedContentId] }),
}));

// ENHANCED: Updated page_content table for JS tracker
export const pageContent = pgTable('page_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id),
  pageUrl: varchar('page_url', { length: 1024 }), // 🔄 NEW: For direct URL lookup by JS tracker
  contentType: varchar('content_type', { length: 64 }).notNull(), // 'title', 'description', 'faq', 'paragraph', 'keywords'
  originalContent: text('original_content'),
  optimizedContent: text('optimized_content').notNull(),
  aiModel: varchar('ai_model', { length: 128 }),
  generationContext: text('generation_context'),
  isActive: integer('is_active').default(1), // 0 or 1 for boolean
  version: integer('version').default(1),
  metadata: jsonb('metadata').default({}), // Store additional data like keyword analysis, character counts, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const contentSuggestions = pgTable('content_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id),
  contentType: varchar('content_type', { length: 64 }).notNull(),
  suggestions: jsonb('suggestions').notNull(), // Array of suggestions from AI
  requestContext: text('request_context'), // Additional context provided by user
  aiModel: varchar('ai_model', { length: 128 }),
  generatedAt: timestamp('generated_at').defaultNow(),
  expiresAt: timestamp('expires_at'), // Optional expiration for suggestion caching
});

// ENHANCED: Updated tracker_data table for JS tracker
export const trackerData = pgTable('tracker_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  pageUrl: varchar('page_url', { length: 1024 }),
  eventType: varchar('event_type', { length: 64 }),
  timestamp: timestamp('timestamp').defaultNow(),
  sessionId: uuid('session_id'),
  anonymousUserId: uuid('anonymous_user_id'),
  eventData: jsonb('event_data'), // 🔄 NEW: Flexible event data storage
  userAgent: varchar('user_agent', { length: 500 }), // 🔄 NEW: Browser information
  ipAddress: inet('ip_address'), // 🔄 NEW: IP address for analytics
  referrer: varchar('referrer', { length: 1024 }), // 🔄 NEW: Referrer URL
  createdAt: timestamp('created_at').defaultNow(),
});

// NEW: Detailed analytics table for JS tracker
export const pageAnalytics = pgTable('page_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  pageUrl: varchar('page_url', { length: 1024 }).notNull(),
  visitDate: date('visit_date').notNull(),
  pageViews: integer('page_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  bounceRate: decimal('bounce_rate', { precision: 5, scale: 2 }),
  avgSessionDuration: integer('avg_session_duration'), // seconds
  loadTimeMs: integer('load_time_ms'),
  contentInjected: boolean('content_injected').default(false),
  contentTypesInjected: varchar('content_types_injected', { length: 500 }).array(), // Array of content types
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Export all table types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Site = typeof sites.$inferSelect;
export type NewSite = typeof sites.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type NewAnalysisResult = typeof analysisResults.$inferInsert;

export type PageContent = typeof pageContent.$inferSelect;
export type NewPageContent = typeof pageContent.$inferInsert;

export type ContentSuggestion = typeof contentSuggestions.$inferSelect;
export type NewContentSuggestion = typeof contentSuggestions.$inferInsert;

export type TrackerData = typeof trackerData.$inferSelect;
export type NewTrackerData = typeof trackerData.$inferInsert;

export type PageAnalytics = typeof pageAnalytics.$inferSelect;
export type NewPageAnalytics = typeof pageAnalytics.$inferInsert;

// Indexes for performance (these would be in the migration)
/*
Migration SQL:

-- Add page_url to existing page_content table
ALTER TABLE page_content ADD COLUMN page_url VARCHAR(1024);
UPDATE page_content SET page_url = (SELECT url FROM pages WHERE pages.id = page_content.page_id);

-- Create indexes for page_content URL lookup
CREATE INDEX idx_page_content_url_active ON page_content(page_url, content_type, is_active);
CREATE INDEX idx_page_content_site_lookup ON page_content(page_url) WHERE is_active = 1;

-- Add new columns to tracker_data
ALTER TABLE tracker_data ADD COLUMN event_data JSONB;
ALTER TABLE tracker_data ADD COLUMN user_agent VARCHAR(500);
ALTER TABLE tracker_data ADD COLUMN ip_address INET;
ALTER TABLE tracker_data ADD COLUMN referrer VARCHAR(1024);

-- Create indexes for tracker_data
CREATE INDEX idx_tracker_data_site_time ON tracker_data(site_id, timestamp);
CREATE INDEX idx_tracker_data_event_type ON tracker_data(event_type);
CREATE INDEX idx_tracker_data_session ON tracker_data(session_id);

-- Create page_analytics table
-- (Already defined in TypeScript above)

-- Create indexes for page_analytics
CREATE INDEX idx_analytics_site_date ON page_analytics(site_id, visit_date);
CREATE INDEX idx_analytics_url ON page_analytics(page_url);
CREATE UNIQUE INDEX idx_analytics_unique ON page_analytics(site_id, page_url, visit_date);
*/ 