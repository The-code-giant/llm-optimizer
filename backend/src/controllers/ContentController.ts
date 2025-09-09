import { Request, Response, NextFunction } from 'express';
import { db } from '../db/client';
import { sites, pages, contentSuggestions, contentDeployments } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import cache from '../utils/cache';
import { BaseController, AuthenticatedRequest } from './BaseController';
import { 
  CreateContentSchema, 
  UpdateContentSchema,
  UUIDSchema,
  PaginationQuerySchema 
} from '../types/dtos';

export class ContentController extends BaseController {
  /**
   * Get all injected content for a site
   */
  public getSiteContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const siteId = req.params.siteId;

    // Validate siteId
    const siteIdValidation = UUIDSchema.safeParse(siteId);
    if (!siteIdValidation.success) {
      return this.sendError(res, 'Invalid site ID format', 400);
    }

    // Validate query parameters
    const queryValidation = this.validateQuery(PaginationQuerySchema, req.query);
    if (!queryValidation.isValid) {
      return this.sendError(res, 'Invalid query parameters', 400, queryValidation.errors);
    }

    const queryData = queryValidation.data!;
    const { search, sortBy, sortOrder } = queryData;
    const page = queryData.page!; // Safe because schema has default
    const limit = queryData.limit!; // Safe because schema has default
    const offset = (page - 1) * limit;

    // Check site ownership
    const siteArr = await db.select().from(sites).where(and(eq(sites.id, siteId), eq(sites.userId, userId))).limit(1);
    const site = siteArr[0];
    
    if (!site) {
      return this.sendError(res, 'Site not found', 404);
    }

    // Build query conditions - ContentController manages content for sites via pages
    // We need to join with pages to filter by siteId
    let whereConditions = eq(pages.siteId, siteId);
    if (search) {
      whereConditions = and(
        whereConditions,
        sql`${contentSuggestions.suggestions}::text ILIKE ${`%${search}%`}`
      )!;
    }

    // Build order by clause
    let orderBy;
    switch (sortBy) {
      case 'contentType':
        orderBy = sortOrder === 'asc' ? contentSuggestions.contentType : desc(contentSuggestions.contentType);
        break;
      case 'deployedAt':
        orderBy = sortOrder === 'asc' ? contentDeployments.deployedAt : desc(contentDeployments.deployedAt);
        break;
      default:
        orderBy = desc(contentSuggestions.generatedAt);
    }

    // Get content suggestions with page information
    const suggestions = await db
      .select({
        id: contentSuggestions.id,
        pageId: contentSuggestions.pageId,
        pageUrl: pages.url,
        pageTitle: pages.title,
        contentType: contentSuggestions.contentType,
        suggestions: contentSuggestions.suggestions,
        aiModel: contentSuggestions.aiModel,
        generatedAt: contentSuggestions.generatedAt
      })
      .from(contentSuggestions)
      .leftJoin(pages, eq(contentSuggestions.pageId, pages.id))
      .where(whereConditions)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get deployments for these suggestions
    const suggestionIds = suggestions.map(s => s.id);
    const deployments = suggestionIds.length > 0 ? await db.select()
      .from(contentDeployments)
      .where(sql`${contentDeployments.pageId} IN (${sql.join(suggestions.map(s => sql`${s.pageId}`), sql`, `)})`)
      .orderBy(desc(contentDeployments.deployedAt)) : [];

    // Combine suggestions and deployments
    const content = suggestions.map(suggestion => {
      const suggestionsArray = Array.isArray(suggestion.suggestions) ? suggestion.suggestions : [];
      const suggestionData = suggestionsArray[0] as any;
      const deployment = deployments.find(d => d.pageId === suggestion.pageId && d.sectionType === suggestion.contentType);
      
      return {
        id: suggestion.id,
        pageId: suggestion.pageId,
        pageUrl: suggestion.pageUrl,
        pageTitle: suggestion.pageTitle,
        contentType: suggestion.contentType,
        originalContent: suggestionData?.originalContent || '',
        optimizedContent: suggestionData?.content || '',
        version: 1,
        isActive: deployment ? 1 : 0,
        deployedAt: deployment?.deployedAt || null,
        deployedBy: deployment?.deployedBy || null,
        createdAt: suggestion.generatedAt,
        updatedAt: suggestion.generatedAt
      };
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentSuggestions)
      .leftJoin(pages, eq(contentSuggestions.pageId, pages.id))
      .where(whereConditions);

    this.sendSuccess(res, {
      content,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  });

  /**
   * Get specific content by ID
   */
  public getContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const contentId = req.params.contentId;

    // Validate contentId
    const contentIdValidation = UUIDSchema.safeParse(contentId);
    if (!contentIdValidation.success) {
      return this.sendError(res, 'Invalid content ID format', 400);
    }

    // Get content with page and site information
    const contentArr = await db
      .select({
        content: pageContent,
        page: pages,
        site: sites
      })
      .from(pageContent)
      .leftJoin(pages, eq(pageContent.pageId, pages.id))
      .leftJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(pageContent.id, contentId))
      .limit(1);

    const result = contentArr[0];
    if (!result || !result.site || result.site.userId !== userId) {
      return this.sendError(res, 'Content not found', 404);
    }

    this.sendSuccess(res, {
      ...result.content,
      page: result.page,
      site: result.site
    });
  });

  /**
   * Create new content
   */
  public createContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const pageId = req.params.pageId;

    // Validate pageId
    const pageIdValidation = UUIDSchema.safeParse(pageId);
    if (!pageIdValidation.success) {
      return this.sendError(res, 'Invalid page ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(CreateContentSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const contentData = bodyValidation.data!;

    // Check page ownership
    const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
    const page = pageArr[0];
    
    if (!page) {
      return this.sendError(res, 'Page not found', 404);
    }

    const siteArr = await db.select().from(sites).where(eq(sites.id, page.siteId)).limit(1);
    const site = siteArr[0];
    
    if (!site || site.userId !== userId) {
      return this.sendError(res, 'Not authorized', 403);
    }

    // Get the next version number for this content type
    const existingContent = await db.select()
      .from(pageContent)
      .where(and(
        eq(pageContent.pageId, pageId),
        eq(pageContent.contentType, contentData.type)
      ))
      .orderBy(desc(pageContent.version))
      .limit(1);

    const nextVersion = existingContent.length > 0 && existingContent[0] ? (existingContent[0].version || 0) + 1 : 1;

    // Create the content
    const [newContent] = await db.insert(pageContent).values({
      pageId,
      contentType: contentData.type,
      optimizedContent: contentData.content,
      version: nextVersion,
      isActive: contentData.status === 'active' ? 1 : 0,
      pageUrl: page.url,
      deployedAt: contentData.status === 'active' ? new Date() : null,
      deployedBy: contentData.status === 'active' ? userId : null,
      metadata: { name: contentData.name }
    }).returning();

    // Invalidate cache if content is active
    if (contentData.status === 'active') {
      await cache.invalidateTrackerContent(site.trackerId, page.url);
      console.log(`🗑️ Cache invalidated for tracker ${site.trackerId}, page ${page.url}`);
    }

    this.sendSuccess(res, newContent, 'Content created successfully', 201);
  });

  /**
   * Update existing content
   */
  public updateContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const contentId = req.params.contentId;

    // Validate contentId
    const contentIdValidation = UUIDSchema.safeParse(contentId);
    if (!contentIdValidation.success) {
      return this.sendError(res, 'Invalid content ID format', 400);
    }

    // Validate request body
    const bodyValidation = this.validateBody(UpdateContentSchema, req.body);
    if (!bodyValidation.isValid) {
      return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
    }

    const updateData = bodyValidation.data!;

    // Get content with page and site information
    const contentArr = await db
      .select({
        content: pageContent,
        page: pages,
        site: sites
      })
      .from(pageContent)
      .leftJoin(pages, eq(pageContent.pageId, pages.id))
      .leftJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(pageContent.id, contentId))
      .limit(1);

    const result = contentArr[0];
    if (!result || !result.site || result.site.userId !== userId) {
      return this.sendError(res, 'Content not found', 404);
    }

    const { content, page, site } = result;

    // Prepare update object
    const updateObj: any = {
      updatedAt: new Date()
    };

    if (updateData.content !== undefined) {
      updateObj.optimizedContent = updateData.content;
    }

    if (updateData.name !== undefined) {
      const currentMetadata = content.metadata as any || {};
      updateObj.metadata = { ...currentMetadata, name: updateData.name };
    }

    if (updateData.status !== undefined) {
      const wasActive = content.isActive === 1;
      const willBeActive = updateData.status === 'active';
      
      updateObj.isActive = willBeActive ? 1 : 0;
      
      if (willBeActive && !wasActive) {
        updateObj.deployedAt = new Date();
        updateObj.deployedBy = userId;
      } else if (!willBeActive && wasActive) {
        updateObj.deployedAt = null;
        updateObj.deployedBy = null;
      }
    }

    // Update the content
    const [updatedContent] = await db
      .update(pageContent)
      .set(updateObj)
      .where(eq(pageContent.id, contentId))
      .returning();

    // Invalidate cache if content status changed
    if (updateData.status !== undefined) {
      await cache.invalidateTrackerContent(site.trackerId, page!.url);
      console.log(`🗑️ Cache invalidated for tracker ${site.trackerId}, page ${page!.url}`);
    }

    this.sendSuccess(res, updatedContent, 'Content updated successfully');
  });

  /**
   * Delete content
   */
  public deleteContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const contentId = req.params.contentId;

    // Validate contentId
    const contentIdValidation = UUIDSchema.safeParse(contentId);
    if (!contentIdValidation.success) {
      return this.sendError(res, 'Invalid content ID format', 400);
    }

    // Get content with page and site information
    const contentArr = await db
      .select({
        content: pageContent,
        page: pages,
        site: sites
      })
      .from(pageContent)
      .leftJoin(pages, eq(pageContent.pageId, pages.id))
      .leftJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(pageContent.id, contentId))
      .limit(1);

    const result = contentArr[0];
    if (!result || !result.site || result.site.userId !== userId) {
      return this.sendError(res, 'Content not found', 404);
    }

    const { content, page, site } = result;
    const wasActive = content.isActive === 1;

    // Delete the content
    await db.delete(pageContent).where(eq(pageContent.id, contentId));

    // Invalidate cache if content was active
    if (wasActive) {
      await cache.invalidateTrackerContent(site.trackerId, page!.url);
      console.log(`🗑️ Cache invalidated for tracker ${site.trackerId}, page ${page!.url}`);
    }

    this.sendSuccess(res, null, 'Content deleted successfully');
  });

  /**
   * Deploy/activate content
   */
  public deployContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const contentId = req.params.contentId;

    // Validate contentId
    const contentIdValidation = UUIDSchema.safeParse(contentId);
    if (!contentIdValidation.success) {
      return this.sendError(res, 'Invalid content ID format', 400);
    }

    // Get content with page and site information
    const contentArr = await db
      .select({
        content: pageContent,
        page: pages,
        site: sites
      })
      .from(pageContent)
      .leftJoin(pages, eq(pageContent.pageId, pages.id))
      .leftJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(pageContent.id, contentId))
      .limit(1);

    const result = contentArr[0];
    if (!result || !result.site || result.site.userId !== userId) {
      return this.sendError(res, 'Content not found', 404);
    }

    const { content, page, site } = result;

    // Deactivate other content of the same type for this page
    await db
      .update(pageContent)
      .set({ 
        isActive: 0, 
        deployedAt: null, 
        deployedBy: null,
        updatedAt: new Date() 
      })
      .where(and(
        eq(pageContent.pageId, content.pageId),
        eq(pageContent.contentType, content.contentType),
        sql`${pageContent.id} != ${contentId}`
      ));

    // Activate this content
    const [deployedContent] = await db
      .update(pageContent)
      .set({
        isActive: 1,
        deployedAt: new Date(),
        deployedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(pageContent.id, contentId))
      .returning();

    // Invalidate cache
    await cache.invalidateTrackerContent(site.trackerId, page!.url);
    console.log(`🗑️ Cache invalidated for tracker ${site.trackerId}, page ${page!.url}`);

    this.sendSuccess(res, deployedContent, 'Content deployed successfully');
  });

  /**
   * Undeploy/deactivate content
   */
  public undeployContent = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = this.getAuthenticatedUser(req);
    const contentId = req.params.contentId;

    // Validate contentId
    const contentIdValidation = UUIDSchema.safeParse(contentId);
    if (!contentIdValidation.success) {
      return this.sendError(res, 'Invalid content ID format', 400);
    }

    // Get content with page and site information
    const contentArr = await db
      .select({
        content: pageContent,
        page: pages,
        site: sites
      })
      .from(pageContent)
      .leftJoin(pages, eq(pageContent.pageId, pages.id))
      .leftJoin(sites, eq(pages.siteId, sites.id))
      .where(eq(pageContent.id, contentId))
      .limit(1);

    const result = contentArr[0];
    if (!result || !result.site || result.site.userId !== userId) {
      return this.sendError(res, 'Content not found', 404);
    }

    const { content, page, site } = result;

    // Deactivate the content
    const [undeployedContent] = await db
      .update(pageContent)
      .set({
        isActive: 0,
        deployedAt: null,
        deployedBy: null,
        updatedAt: new Date()
      })
      .where(eq(pageContent.id, contentId))
      .returning();

    // Invalidate cache
    await cache.invalidateTrackerContent(site.trackerId, page!.url);
    console.log(`🗑️ Cache invalidated for tracker ${site.trackerId}, page ${page!.url}`);

    this.sendSuccess(res, undeployedContent, 'Content undeployed successfully');
  });
}
