import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export abstract class BaseController {
  /**
   * Send success response
   */
  protected sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  protected sendError(res: Response, error: string, statusCode: number = 400, errors?: any[]): void {
    const response: ApiResponse = {
      success: false,
      error,
      errors
    };
    res.status(statusCode).json(response);
  }

  /**
   * Validate request body with Zod schema
   */
  protected validateBody<T>(schema: z.ZodSchema<T>, body: any): { isValid: boolean; data?: T; errors?: any[] } {
    const result = schema.safeParse(body);
    if (result.success) {
      return { isValid: true, data: result.data };
    }
    return { isValid: false, errors: result.error.issues };
  }

  /**
   * Validate query parameters with Zod schema
   */
  protected validateQuery<T>(schema: z.ZodSchema<T>, query: any): { isValid: boolean; data?: T; errors?: any[] } {
    const result = schema.safeParse(query);
    if (result.success) {
      return { isValid: true, data: result.data };
    }
    return { isValid: false, errors: result.error.issues };
  }

  /**
   * Async wrapper for controller methods to handle errors
   */
  protected asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  /**
   * Get authenticated user from request
   */
  protected getAuthenticatedUser(req: AuthenticatedRequest): { userId: string; email: string } {
    if (!req.user) {
      throw new Error('User not authenticated');
    }
    return req.user;
  }

  /**
   * Extract pagination parameters
   */
  protected getPaginationParams(query: any): { page: number; limit: number; offset: number } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }
}
