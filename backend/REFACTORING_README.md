# Backend Refactoring Guide

This document outlines the refactored backend architecture that implements proper MVC patterns, improved scalability, and better maintainability.

## 🏗️ New Architecture

### Directory Structure
```
backend/src/
├── controllers/           # Business logic controllers
│   ├── BaseController.ts  # Base controller with common functionality
│   ├── PagesController.ts # Page management logic
│   ├── SitesController.ts # Site management logic
│   ├── AnalysisController.ts # Analysis logic
│   ├── TrackerController.ts # Tracker logic
│   └── ContentController.ts # Content management logic
├── routes/               # Route definitions (thin layer)
│   ├── *.refactored.ts   # New refactored routes
│   └── *.ts             # Original routes (to be replaced)
├── types/               # DTOs and validation schemas
│   └── dtos.ts          # All DTOs and Zod schemas
├── middleware/          # Middleware functions
│   ├── auth.ts          # Authentication middleware
│   ├── rateLimit.ts     # Rate limiting
│   └── errorHandler.ts  # Error handling middleware
├── services/            # Business services
├── utils/               # Utility functions
└── db/                  # Database related files
```

## 🔧 Key Improvements

### 1. **MVC Architecture**
- **Controllers**: Handle business logic, validation, and orchestration
- **Routes**: Thin layer that maps HTTP endpoints to controller methods
- **Services**: Reusable business logic and external integrations
- **Models**: Database schema and ORM configurations

### 2. **Standardized Response Format**
All API responses now follow a consistent format:
```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  errors?: any[];
}
```

### 3. **Input Validation**
- **Zod schemas** for all DTOs
- **Type-safe validation** at controller level
- **Consistent error messages** for validation failures

### 4. **Error Handling**
- **Centralized error handling** middleware
- **Consistent error responses** across all endpoints
- **Proper HTTP status codes**
- **Development vs production error details**

### 5. **Base Controller**
Common functionality extracted to `BaseController`:
- Response formatting (`sendSuccess`, `sendError`)
- Input validation (`validateBody`, `validateQuery`)
- Pagination helpers (`getPaginationParams`)
- Authentication helpers (`getAuthenticatedUser`)
- Async error handling (`asyncHandler`)

## 📝 Controller Examples

### PagesController
```typescript
public getPage = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = this.getAuthenticatedUser(req);
  const pageId = req.params.pageId;

  // Validation
  const pageIdValidation = UUIDSchema.safeParse(pageId);
  if (!pageIdValidation.success) {
    return this.sendError(res, 'Invalid page ID format', 400);
  }

  // Business logic
  const page = await this.getPageWithOwnershipCheck(pageId, userId);
  
  // Response
  this.sendSuccess(res, page);
});
```

### Route Definition
```typescript
const pagesController = new PagesController();
router.get('/:pageId', authenticateJWT, pagesController.getPage);
```

## 🔄 Migration Strategy

### Phase 1: Controllers Ready ✅
- [x] Created all controller classes
- [x] Implemented base controller functionality
- [x] Added proper error handling
- [x] Created DTOs and validation schemas

### Phase 2: Route Updates (In Progress)
- [x] Created refactored route files (*.refactored.ts)
- [ ] Update main index.ts to use new routes
- [ ] Test all endpoints
- [ ] Remove old route files

### Phase 3: Cleanup
- [ ] Remove unused imports and dependencies
- [ ] Update tests to use new structure
- [ ] Update documentation

## 🧪 Testing the Refactored Code

### 1. **Start the server** with refactored routes:
```bash
cd backend
npm run dev
```

### 2. **Test endpoints** using the new structure:
```bash
# Get all sites
GET /api/v1/sites

# Create a new site
POST /api/v1/sites
{
  "name": "Test Site",
  "url": "https://example.com"
}

# Trigger page analysis
POST /api/v1/pages/{pageId}/analysis
{
  "forceRefresh": true
}
```

### 3. **Verify error handling**:
```bash
# Test validation errors
POST /api/v1/sites
{
  "name": "",
  "url": "invalid-url"
}

# Test authentication
GET /api/v1/sites
# (without Authorization header)
```

## 🚀 Benefits

### For Developers
- **Better code organization** and separation of concerns
- **Type safety** with TypeScript and Zod validation
- **Consistent patterns** across all endpoints
- **Easier testing** with isolated controller logic
- **Better error handling** and debugging

### For the Application
- **Improved performance** with optimized database queries
- **Better security** with proper input validation
- **Consistent API responses** for frontend consumption
- **Easier maintenance** and feature additions
- **Scalable architecture** for future growth

## 🔧 Usage Examples

### Adding a New Endpoint

1. **Add DTO to `types/dtos.ts`**:
```typescript
export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
  pageId: UUIDSchema
});

export type CreateCommentDto = z.infer<typeof CreateCommentSchema>;
```

2. **Add method to controller**:
```typescript
public createComment = this.asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = this.getAuthenticatedUser(req);
  
  const bodyValidation = this.validateBody(CreateCommentSchema, req.body);
  if (!bodyValidation.isValid) {
    return this.sendError(res, 'Invalid request body', 400, bodyValidation.errors);
  }

  const comment = await this.commentService.create(bodyValidation.data!, userId);
  this.sendSuccess(res, comment, 'Comment created successfully', 201);
});
```

3. **Add route**:
```typescript
router.post('/comments', authenticateJWT, controller.createComment);
```

## 🔍 Next Steps

1. **Replace original routes** with refactored versions
2. **Add comprehensive tests** for all controllers
3. **Add OpenAPI/Swagger documentation** generation
4. **Implement request/response logging** middleware
5. **Add metrics and monitoring** integration
6. **Consider adding caching** at controller level for frequently accessed data

This refactored architecture provides a solid foundation for scaling the backend while maintaining code quality and developer productivity.

