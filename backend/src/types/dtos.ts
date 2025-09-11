import { z } from 'zod';

// Common schemas
export const UUIDSchema = z.string().uuid();
export const URLSchema = z.string().url();
export const EmailSchema = z.string().email();

// Pagination schemas
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).transform(data => ({
  ...data,
  page: data.page ?? 1,
  limit: data.limit ?? 20
}));

// Site DTOs
export const CreateSiteSchema = z.object({
  name: z.string().min(1).max(255),
  url: URLSchema
});

export const UpdateSiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: URLSchema.optional(),
  settings: z.record(z.any()).optional()
});

export const SitemapImportSchema = z.object({
  sitemapUrl: URLSchema.optional()
});

// Page DTOs
export const CreatePageSchema = z.object({
  url: URLSchema,
  title: z.string().min(1).max(255).optional()
});

export const PageAnalysisSchema = z.object({
  forceRefresh: z.boolean().default(false)
}).optional().default({});

export const PageContentSchema = z.object({
  contentType: z.enum(['title', 'description', 'faq', 'paragraph', 'keywords', 'schema']),
  originalContent: z.string().optional(),
  optimizedContent: z.string(),
  generationContext: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  deployImmediately: z.boolean().default(false)
});

export const SectionContentSchema = z.object({
  sectionType: z.enum(['title', 'description', 'headings', 'content', 'schema', 'images', 'links']),
  selectedRecommendations: z.array(z.string()),
  currentContent: z.string().optional(),
  additionalContext: z.string().optional()
});

// Content DTOs
export const CreateContentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(['faq', 'schema', 'custom_html', 'paragraph', 'keywords']),
  content: z.string(),
  targetPageIds: z.array(UUIDSchema).optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft')
});

export const UpdateContentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  targetPageIds: z.array(UUIDSchema).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional()
});

// Tracker DTOs
export const TrackerDataSchema = z.object({
  pageUrl: z.string().min(1), // More lenient URL validation for tracker data
  eventType: z.string(),
  timestamp: z.string().optional(), // More lenient timestamp validation
  sessionId: z.string().optional(),
  anonymousUserId: z.string().optional(),
  eventData: z.record(z.any()).optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional()
});

export const TrackerContentQuerySchema = z.object({
  pageUrl: URLSchema
});

// Analysis DTOs
export const BulkAnalysisSchema = z.object({
  pageIds: z.array(UUIDSchema).optional(),
  forceRefresh: z.boolean().default(false)
});

// Auth DTOs
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6)
});

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6),
  name: z.string().min(1).max(255)
});

// Lead DTOs
export const LeadSchema = z.object({
  email: EmailSchema,
  phone: z.string().optional(),
  website: URLSchema,
  source: z.string().default('tools'),
  meta: z.record(z.any()).default({})
});

// Response types
export type CreateSiteDto = z.infer<typeof CreateSiteSchema>;
export type UpdateSiteDto = z.infer<typeof UpdateSiteSchema>;
export type SitemapImportDto = z.infer<typeof SitemapImportSchema>;
export type CreatePageDto = z.infer<typeof CreatePageSchema>;
export type PageAnalysisDto = z.infer<typeof PageAnalysisSchema>;
export type PageContentDto = z.infer<typeof PageContentSchema>;
export type SectionContentDto = z.infer<typeof SectionContentSchema>;
export type CreateContentDto = z.infer<typeof CreateContentSchema>;
export type UpdateContentDto = z.infer<typeof UpdateContentSchema>;
export type TrackerDataDto = z.infer<typeof TrackerDataSchema>;
export type TrackerContentQueryDto = z.infer<typeof TrackerContentQuerySchema>;
export type BulkAnalysisDto = z.infer<typeof BulkAnalysisSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LeadDto = z.infer<typeof LeadSchema>;
export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;
