import { pgTable, serial, uuid, varchar, text, timestamp, doublePrecision, jsonb, primaryKey, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
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
  sessionId: uuid('session_id'),
  anonymousUserId: uuid('anonymous_user_id'),
  createdAt: timestamp('created_at').defaultNow(),
});
