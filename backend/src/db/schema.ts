import { pgTable, serial, uuid, varchar, text, timestamp, doublePrecision, jsonb, primaryKey, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 512 }).notNull().unique(),
  trackerId: uuid('tracker_id').notNull().unique(),
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

export const trackerData = pgTable('tracker_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  pageUrl: varchar('page_url', { length: 1024 }),
  eventType: varchar('event_type', { length: 64 }),
  timestamp: timestamp('timestamp').defaultNow(),
  sessionId: varchar('session_id', { length: 255 }),
  anonymousUserId: varchar('anonymous_user_id', { length: 255 }),
  // New columns for enhanced tracking
  eventData: jsonb('event_data'),
  userAgent: varchar('user_agent', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
  referrer: varchar('referrer', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pageContent = pgTable('page_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id),
  contentType: varchar('content_type', { length: 64 }).notNull(), // 'title', 'description', 'faq', 'paragraph', 'keywords', 'schema'
  originalContent: text('original_content'),
  optimizedContent: text('optimized_content').notNull(),
  aiModel: varchar('ai_model', { length: 128 }),
  generationContext: text('generation_context'),
  isActive: integer('is_active').default(0), // 0 = draft, 1 = deployed
  version: integer('version').default(1),
  metadata: jsonb('metadata').default({}), // Store additional data like keyword analysis, character counts, etc.
  pageUrl: varchar('page_url', { length: 1024 }),
  deployedAt: timestamp('deployed_at'), // When this content was deployed
  deployedBy: varchar('deployed_by', { length: 255 }), // User ID who deployed it
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

export const pageAnalytics = pgTable('page_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  pageUrl: varchar('page_url', { length: 1024 }).notNull(),
  visitDate: varchar('visit_date', { length: 10 }).notNull(), // YYYY-MM-DD format
  pageViews: integer('page_views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  bounceRate: doublePrecision('bounce_rate'),
  avgSessionDuration: integer('avg_session_duration'), // seconds
  loadTimeMs: integer('load_time_ms'),
  contentInjected: integer('content_injected').default(0), // 0 or 1 for boolean
  contentTypesInjected: jsonb('content_types_injected').default([]), // Array of content types
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
