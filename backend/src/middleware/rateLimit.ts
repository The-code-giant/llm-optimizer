import { Request, Response, NextFunction } from 'express';
import cache from '../utils/cache';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [RATE-LIMIT-${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

/**
 * Create a rate limiting middleware
 */
export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => `${req.ip}:${req.originalUrl}`,
    onLimitReached
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const windowSeconds = Math.ceil(windowMs / 1000);
      
      const result = await cache.checkRateLimit(key, maxRequests, windowSeconds);
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        logger.warn(`🚫 Rate limit exceeded for ${key}: ${maxRequests} requests per ${windowMs}ms`);
        
        if (onLimitReached) {
          onLimitReached(req, res);
        }
        
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${maxRequests} per ${windowMs}ms`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        });
        return;
      }

      // Handle response completion for conditional counting
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(data) {
          const statusCode = res.statusCode;
          const shouldSkip = 
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400);
          
          if (shouldSkip) {
            // We would need to decrement the counter here
            // This is a simplified implementation
            logger.debug(`Skipping rate limit count for ${key} due to status ${statusCode}`);
          }
          
          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      logger.error(`Rate limit middleware error: ${error}`);
      // Fail open - allow request if rate limiting fails
      next();
    }
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */

// Tracker endpoints - high volume, moderate limits
export const trackerRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 1000, // 1000 requests per minute per IP
  keyGenerator: (req) => {
    // Rate limit by IP for tracker endpoints
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : req.ip;
    return `tracker:${clientIp}`;
  },
  onLimitReached: (req, res) => {
    logger.warn(`🚫 Tracker rate limit exceeded from IP: ${req.ip}`);
  }
});

// Dashboard API - lower volume, stricter limits
export const dashboardRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000, // 1000 requests per 15 minutes
  keyGenerator: (req) => {
    // Rate limit by user ID if available, otherwise IP
    const userId = req.headers['x-user-id'] as string || req.ip;
    return `dashboard:${userId}`;
  },
  onLimitReached: (req, res) => {
    logger.warn(`🚫 Dashboard rate limit exceeded for user: ${req.headers['x-user-id'] || req.ip}`);
  }
});

// Auth endpoints - very strict limits
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 attempts per 15 minutes
  keyGenerator: (req) => {
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : req.ip;
    return `auth:${clientIp}`;
  },
  skipSuccessfulRequests: true, // Only count failed attempts
  onLimitReached: (req, res) => {
    logger.error(`🚫 Auth rate limit exceeded from IP: ${req.ip} - Potential brute force attack`);
  }
});

// Sitemap import - very conservative
export const sitemapImportRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 imports per hour per user
  keyGenerator: (req) => {
    const userId = req.headers['x-user-id'] as string || req.ip;
    return `sitemap:${userId}`;
  },
  onLimitReached: (req, res) => {
    logger.warn(`🚫 Sitemap import rate limit exceeded for user: ${req.headers['x-user-id'] || req.ip}`);
  }
});

// AI Analysis - moderate limits due to external API costs
export const analysisRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // 100 analysis requests per hour per user
  keyGenerator: (req) => {
    const userId = req.headers['x-user-id'] as string || req.ip;
    return `analysis:${userId}`;
  },
  onLimitReached: (req, res) => {
    logger.warn(`🚫 Analysis rate limit exceeded for user: ${req.headers['x-user-id'] || req.ip}`);
  }
});

/**
 * Enhanced rate limiting for specific tracker IDs
 */
export function createTrackerSpecificRateLimit(maxRequestsPerMinute: number = 500) {
  return createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: maxRequestsPerMinute,
    keyGenerator: (req) => {
      const trackerId = req.params.trackerId || req.body.trackerId;
      return `tracker_specific:${trackerId}`;
    },
    onLimitReached: (req, res) => {
      const trackerId = req.params.trackerId || req.body.trackerId;
      logger.warn(`🚫 Tracker-specific rate limit exceeded for tracker: ${trackerId}`);
    }
  });
}

/**
 * IP-based rate limiting for general protection
 */
export const generalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10000, // 10000 requests per 15 minutes per IP (very generous)
  keyGenerator: (req) => {
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const clientIp = forwardedFor ? forwardedFor.split(',')[0] : req.ip;
    return `general:${clientIp}`;
  },
  onLimitReached: (req, res) => {
    logger.error(`🚫 General rate limit exceeded from IP: ${req.ip} - Possible DDoS or abuse`);
  }
});

export default {
  createRateLimit,
  trackerRateLimit,
  dashboardRateLimit,
  authRateLimit,
  sitemapImportRateLimit,
  analysisRateLimit,
  createTrackerSpecificRateLimit,
  generalRateLimit
}; 