import { pgTable, foreignKey, uuid, varchar, jsonb, text, timestamp, unique, integer, doublePrecision, boolean, numeric, uniqueIndex, serial, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const subscriptionType = pgEnum("subscription_type", ['free', 'pro', 'enterprise'])


export const contentSuggestions = pgTable("content_suggestions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageId: uuid("page_id").notNull(),
	contentType: varchar("content_type", { length: 64 }).notNull(),
	suggestions: jsonb().notNull(),
	requestContext: text("request_context"),
	aiModel: varchar("ai_model", { length: 128 }),
	generatedAt: timestamp("generated_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => {
	return {
		contentSuggestionsPageIdPagesIdFk: foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "content_suggestions_page_id_pages_id_fk"
		}),
	}
});

export const users = pgTable("users", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }),
	name: varchar({ length: 255 }),
	preferences: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		usersEmailUnique: unique("users_email_unique").on(table.email),
	}
});

export const pageAnalytics = pgTable("page_analytics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteId: uuid("site_id").notNull(),
	pageUrl: varchar("page_url", { length: 1024 }).notNull(),
	visitDate: varchar("visit_date", { length: 10 }).notNull(),
	pageViews: integer("page_views").default(0),
	uniqueVisitors: integer("unique_visitors").default(0),
	bounceRate: doublePrecision("bounce_rate"),
	avgSessionDuration: integer("avg_session_duration"),
	loadTimeMs: integer("load_time_ms"),
	contentInjected: integer("content_injected").default(0),
	contentTypesInjected: jsonb("content_types_injected").default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		pageAnalyticsSiteIdSitesIdFk: foreignKey({
			columns: [table.siteId],
			foreignColumns: [sites.id],
			name: "page_analytics_site_id_sites_id_fk"
		}),
	}
});

export const pageContent = pgTable("page_content", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageId: uuid("page_id").notNull(),
	contentType: varchar("content_type", { length: 64 }).notNull(),
	originalContent: text("original_content"),
	optimizedContent: text("optimized_content").notNull(),
	aiModel: varchar("ai_model", { length: 128 }),
	generationContext: text("generation_context"),
	isActive: integer("is_active").default(0),
	version: integer().default(1),
	metadata: jsonb().default({}),
	deployedAt: timestamp("deployed_at", { mode: 'string' }),
	deployedBy: varchar("deployed_by", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	ragEnhanced: boolean("rag_enhanced").default(false),
	contextSources: text("context_sources").array().default([""]),
	ragScore: numeric("rag_score", { precision: 3, scale:  2 }),
	similarityContext: jsonb("similarity_context").default({}),
}, (table) => {
	return {
		pageContentPageIdPagesIdFk: foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "page_content_page_id_pages_id_fk"
		}),
	}
});

export const injectedContent = pgTable("injected_content", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteId: uuid("site_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 64 }).notNull(),
	content: text(),
	status: varchar({ length: 32 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		injectedContentSiteIdSitesIdFk: foreignKey({
			columns: [table.siteId],
			foreignColumns: [sites.id],
			name: "injected_content_site_id_sites_id_fk"
		}),
	}
});

export const sites = pgTable("sites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	url: varchar({ length: 512 }).notNull(),
	trackerId: uuid("tracker_id").notNull(),
	status: varchar({ length: 32 }).notNull(),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	businessIntelligence: jsonb("business_intelligence").default({}),
	ragEnabled: boolean("rag_enabled").default(false),
	brandVoice: jsonb("brand_voice").default({}),
	targetAudience: jsonb("target_audience").default({}),
	servicesSummary: jsonb("services_summary").default([]),
}, (table) => {
	return {
		urlUnique: uniqueIndex("sites_url_unique").using("btree", table.url.asc().nullsLast()).where(sql`(deleted_at IS NULL)`),
		sitesUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sites_user_id_users_id_fk"
		}),
		sitesTrackerIdUnique: unique("sites_tracker_id_unique").on(table.trackerId),
	}
});

export const trackerData = pgTable("tracker_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteId: uuid("site_id").notNull(),
	pageUrl: varchar("page_url", { length: 1024 }),
	eventType: varchar("event_type", { length: 64 }),
	timestamp: timestamp({ mode: 'string' }).defaultNow(),
	sessionId: varchar("session_id", { length: 255 }),
	anonymousUserId: varchar("anonymous_user_id", { length: 255 }),
	eventData: jsonb("event_data"),
	userAgent: varchar("user_agent", { length: 500 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	referrer: varchar({ length: 1024 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		trackerDataSiteIdSitesIdFk: foreignKey({
			columns: [table.siteId],
			foreignColumns: [sites.id],
			name: "tracker_data_site_id_sites_id_fk"
		}),
	}
});

export const pages = pgTable("pages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteId: uuid("site_id").notNull(),
	url: varchar({ length: 1024 }).notNull(),
	title: varchar({ length: 512 }),
	contentSnapshot: text("content_snapshot"),
	lastScannedAt: timestamp("last_scanned_at", { mode: 'string' }),
	lastAnalysisAt: timestamp("last_analysis_at", { mode: 'string' }),
	llmReadinessScore: doublePrecision("llm_readiness_score"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		pagesSiteIdSitesIdFk: foreignKey({
			columns: [table.siteId],
			foreignColumns: [sites.id],
			name: "pages_site_id_sites_id_fk"
		}),
	}
});

export const analysisResults = pgTable("analysis_results", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	pageId: uuid("page_id").notNull(),
	analyzedAt: timestamp("analyzed_at", { mode: 'string' }).defaultNow(),
	llmModelUsed: varchar("llm_model_used", { length: 128 }),
	score: doublePrecision(),
	recommendations: jsonb(),
	rawLlmOutput: text("raw_llm_output"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		analysisResultsPageIdPagesIdFk: foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "analysis_results_page_id_pages_id_fk"
		}),
	}
});

export const userSubscriptions = pgTable("user_subscriptions", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
	subscriptionType: subscriptionType("subscription_type").default('free'),
	isActive: integer("is_active").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		userSubscriptionsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_subscriptions_user_id_users_id_fk"
		}),
	}
});

export const ragQueries = pgTable("rag_queries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteId: uuid("site_id").notNull(),
	queryText: text("query_text").notNull(),
	responseText: text("response_text").notNull(),
	contextUsed: jsonb("context_used").default([]),
	performanceMetrics: jsonb("performance_metrics").default({}),
	userId: varchar("user_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	responseTimeMs: integer("response_time_ms"),
	similarityScores: jsonb("similarity_scores").default([]),
	feedbackScore: integer("feedback_score"),
	feedbackComment: text("feedback_comment"),
}, (table) => {
	return {
		ragQueriesSiteIdSitesIdFk: foreignKey({
			columns: [table.siteId],
			foreignColumns: [sites.id],
			name: "rag_queries_site_id_sites_id_fk"
		}).onDelete("cascade"),
		ragQueriesUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "rag_queries_user_id_users_id_fk"
		}).onDelete("set null"),
	}
});

export const siteDocuments = pgTable("site_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteId: uuid("site_id").notNull(),
	knowledgeBaseId: uuid("knowledge_base_id").notNull(),
	documentType: varchar("document_type", { length: 32 }).notNull(),
	url: text(),
	title: text(),
	content: text().notNull(),
	metadata: jsonb().default({}),
	embeddingId: text("embedding_id"),
	chunkIndex: integer("chunk_index").default(0),
	totalChunks: integer("total_chunks").default(1),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	lastCrawled: timestamp("last_crawled", { mode: 'string' }),
	status: varchar({ length: 32 }).default('pending').notNull(),
}, (table) => {
	return {
		siteDocumentsSiteIdSitesIdFk: foreignKey({
			columns: [table.siteId],
			foreignColumns: [sites.id],
			name: "site_documents_site_id_sites_id_fk"
		}).onDelete("cascade"),
		siteDocumentsKnowledgeBaseIdSiteKnowledgeBasesIdFk: foreignKey({
			columns: [table.knowledgeBaseId],
			foreignColumns: [siteKnowledgeBases.id],
			name: "site_documents_knowledge_base_id_site_knowledge_bases_id_fk"
		}).onDelete("cascade"),
	}
});

export const siteKnowledgeBases = pgTable("site_knowledge_bases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	siteId: uuid("site_id").notNull(),
	status: varchar({ length: 32 }).default('initializing').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	totalDocuments: integer("total_documents").default(0).notNull(),
	lastRefresh: timestamp("last_refresh", { mode: 'string' }),
	ragEnabled: boolean("rag_enabled").default(false).notNull(),
	settings: jsonb().default({}),
	errorMessage: text("error_message"),
}, (table) => {
	return {
		siteIdUnique: uniqueIndex("site_knowledge_bases_site_id_unique").using("btree", table.siteId.asc().nullsLast()),
		siteKnowledgeBasesSiteIdSitesIdFk: foreignKey({
			columns: [table.siteId],
			foreignColumns: [sites.id],
			name: "site_knowledge_bases_site_id_sites_id_fk"
		}).onDelete("cascade"),
	}
});

export const pageInjectedContent = pgTable("page_injected_content", {
	pageId: uuid("page_id").notNull(),
	injectedContentId: uuid("injected_content_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => {
	return {
		pageInjectedContentPageIdPagesIdFk: foreignKey({
			columns: [table.pageId],
			foreignColumns: [pages.id],
			name: "page_injected_content_page_id_pages_id_fk"
		}),
		pageInjectedContentInjectedContentIdInjectedContentIdF: foreignKey({
			columns: [table.injectedContentId],
			foreignColumns: [injectedContent.id],
			name: "page_injected_content_injected_content_id_injected_content_id_f"
		}),
		pageInjectedContentPageIdInjectedContentIdPk: primaryKey({ columns: [table.pageId, table.injectedContentId], name: "page_injected_content_page_id_injected_content_id_pk"}),
	}
});
