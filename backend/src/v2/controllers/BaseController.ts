import { Request, Response } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export abstract class BaseController {
  protected success<T>(res: Response, data?: T, message?: string, meta?: any): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      meta
    };
    res.json(response);
  }

  protected error(res: Response, message: string, statusCode: number = 400): void {
    const response: ApiResponse = {
      success: false,
      error: message
    };
    res.status(statusCode).json(response);
  }

  protected handleError(res: Response, error: any, context: string = ''): void {
    console.error(`${context} Error:`, error);
    
    if (error.name === 'ValidationError') {
      return this.error(res, error.message, 400);
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return this.error(res, 'External service unavailable', 503);
    }
    
    this.error(res, 'Internal server error', 500);
  }
}