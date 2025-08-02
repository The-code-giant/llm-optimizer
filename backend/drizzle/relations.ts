import { relations } from "drizzle-orm/relations";
import { pages, contentSuggestions, sites, pageAnalytics, pageContent, injectedContent, users, trackerData, analysisResults, userSubscriptions, ragQueries, siteDocuments, siteKnowledgeBases, pageInjectedContent } from "./schema";

export const contentSuggestionsRelations = relations(contentSuggestions, ({one}) => ({
	page: one(pages, {
		fields: [contentSuggestions.pageId],
		references: [pages.id]
	}),
}));

export const pagesRelations = relations(pages, ({one, many}) => ({
	contentSuggestions: many(contentSuggestions),
	pageContents: many(pageContent),
	site: one(sites, {
		fields: [pages.siteId],
		references: [sites.id]
	}),
	analysisResults: many(analysisResults),
	pageInjectedContents: many(pageInjectedContent),
}));

export const pageAnalyticsRelations = relations(pageAnalytics, ({one}) => ({
	site: one(sites, {
		fields: [pageAnalytics.siteId],
		references: [sites.id]
	}),
}));

export const sitesRelations = relations(sites, ({one, many}) => ({
	pageAnalytics: many(pageAnalytics),
	injectedContents: many(injectedContent),
	user: one(users, {
		fields: [sites.userId],
		references: [users.id]
	}),
	trackerData: many(trackerData),
	pages: many(pages),
	ragQueries: many(ragQueries),
	siteDocuments: many(siteDocuments),
	siteKnowledgeBases: many(siteKnowledgeBases),
}));

export const pageContentRelations = relations(pageContent, ({one}) => ({
	page: one(pages, {
		fields: [pageContent.pageId],
		references: [pages.id]
	}),
}));

export const injectedContentRelations = relations(injectedContent, ({one, many}) => ({
	site: one(sites, {
		fields: [injectedContent.siteId],
		references: [sites.id]
	}),
	pageInjectedContents: many(pageInjectedContent),
}));

export const usersRelations = relations(users, ({many}) => ({
	sites: many(sites),
	userSubscriptions: many(userSubscriptions),
	ragQueries: many(ragQueries),
}));

export const trackerDataRelations = relations(trackerData, ({one}) => ({
	site: one(sites, {
		fields: [trackerData.siteId],
		references: [sites.id]
	}),
}));

export const analysisResultsRelations = relations(analysisResults, ({one}) => ({
	page: one(pages, {
		fields: [analysisResults.pageId],
		references: [pages.id]
	}),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one}) => ({
	user: one(users, {
		fields: [userSubscriptions.userId],
		references: [users.id]
	}),
}));

export const ragQueriesRelations = relations(ragQueries, ({one}) => ({
	site: one(sites, {
		fields: [ragQueries.siteId],
		references: [sites.id]
	}),
	user: one(users, {
		fields: [ragQueries.userId],
		references: [users.id]
	}),
}));

export const siteDocumentsRelations = relations(siteDocuments, ({one}) => ({
	site: one(sites, {
		fields: [siteDocuments.siteId],
		references: [sites.id]
	}),
	siteKnowledgeBase: one(siteKnowledgeBases, {
		fields: [siteDocuments.knowledgeBaseId],
		references: [siteKnowledgeBases.id]
	}),
}));

export const siteKnowledgeBasesRelations = relations(siteKnowledgeBases, ({one, many}) => ({
	siteDocuments: many(siteDocuments),
	site: one(sites, {
		fields: [siteKnowledgeBases.siteId],
		references: [sites.id]
	}),
}));

export const pageInjectedContentRelations = relations(pageInjectedContent, ({one}) => ({
	page: one(pages, {
		fields: [pageInjectedContent.pageId],
		references: [pages.id]
	}),
	injectedContent: one(injectedContent, {
		fields: [pageInjectedContent.injectedContentId],
		references: [injectedContent.id]
	}),
}));