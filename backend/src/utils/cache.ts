import redis from './redis';
import crypto from 'crypto';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [CACHE-${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Cache key constants
export const CACHE_KEYS = {
  // Content caching (highest priority)
  TRACKER_CONTENT: 'tracker:content',
  
  // Dashboard caching
  USER_SITES: 'user:sites',
  SITE_PAGES: 'site:pages',
  SITE_ANALYTICS: 'site:analytics',
  PAGE_ANALYSIS: 'page:analysis',
  
  // Rate limiting
  RATE_LIMIT: 'rate_limit',
  
  // Event buffering
  TRACKER_EVENTS: 'tracker_events',
  
  // Session cache
  SESSION: 'session',

  // User sub status
  USER_SUB_STATUS: 'user:sub:status',
};

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  TRACKER_CONTENT: 300,      // 5 minutes (content changes infrequently)
  DASHBOARD_SHORT: 60,       // 1 minute (live data)
  DASHBOARD_MEDIUM: 300,     // 5 minutes (analysis results)
  DASHBOARD_LONG: 1800,      // 30 minutes (site configuration)
  RATE_LIMIT_WINDOW: 60,     // 1 minute rate limiting window
  SESSION: 3600,             // 1 hour session cache
  USER_SUB_STATUS: 1800,       // 30 minutes user sub status cache
};

interface CacheOptions {
  ttl?: number;
  serialize?: boolean;
}

class CacheService {
  /**
   * Generate a hash-based cache key for complex objects
   */
  private generateCacheKey(prefix: string, ...parts: (string | number | object)[]): string {
    const keyParts = parts.map(part => 
      typeof part === 'object' ? JSON.stringify(part) : String(part)
    );
    const content = keyParts.join(':');
    const hash = crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
    return `${prefix}:${hash}`;
  }

  /**
   * Normalize URL for consistent caching
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash, hash, and normalize
      return urlObj.origin + urlObj.pathname.replace(/\/$/, '') + urlObj.search;
    } catch {
      return url.toLowerCase().replace(/\/$/, '');
    }
  }

  /**
   * Get cached data with automatic JSON parsing
   */
  async get<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (!cached) return defaultValue;
      
      try {
        return JSON.parse(cached) as T;
      } catch {
        // If parsing fails, return as string
        return cached as unknown as T;
      }
    } catch (error) {
      logger.error(`Cache GET error for key ${key}: ${error}`);
      return defaultValue;
    }
  }

  /**
   * Set cached data with automatic JSON serialization
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<boolean> {
    try {
      const { ttl, serialize = true } = options;
      const serializedValue = serialize ? JSON.stringify(value) : String(value);
      return await redis.set(key, serializedValue, ttl);
    } catch (error) {
      logger.error(`Cache SET error for key ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<boolean> {
    return await redis.del(key);
  }

  /**
   * TRACKER CONTENT CACHING - Highest Priority
   */
  async getTrackerContent(trackerId: string, pageUrl: string): Promise<any> {
    const normalizedUrl = this.normalizeUrl(pageUrl);
    const key = `${CACHE_KEYS.TRACKER_CONTENT}:${trackerId}:${normalizedUrl}`;
    
    const cached = await this.get(key);
    if (cached) {
      logger.info(`🎯 Cache HIT: tracker content for ${trackerId}:${normalizedUrl}`);
    }
    return cached;
  }

  async setTrackerContent(trackerId: string, pageUrl: string, content: any): Promise<boolean> {
    const normalizedUrl = this.normalizeUrl(pageUrl);
    const key = `${CACHE_KEYS.TRACKER_CONTENT}:${trackerId}:${normalizedUrl}`;
    
    const success = await this.set(key, content, { ttl: CACHE_TTL.TRACKER_CONTENT });
    if (success) {
      logger.info(`💾 Cache SET: tracker content for ${trackerId}:${normalizedUrl}`);
    }
    return success;
  }

  async invalidateTrackerContent(trackerId: string, pageUrl?: string): Promise<void> {
    if (pageUrl) {
      const normalizedUrl = this.normalizeUrl(pageUrl);
      const key = `${CACHE_KEYS.TRACKER_CONTENT}:${trackerId}:${normalizedUrl}`;
      await this.delete(key);
      logger.info(`🗑️  Cache INVALIDATE: tracker content for ${trackerId}:${normalizedUrl}`);
    } else {
      // Invalidate all content for this tracker (requires pattern deletion)
      logger.info(`🗑️  Cache INVALIDATE: all tracker content for ${trackerId}`);
      // Note: We would need to implement pattern deletion for full invalidation
    }
  }

  /**
   * DASHBOARD CACHING
   */
  async getUserSites(userId: string): Promise<any> {
    const key = `${CACHE_KEYS.USER_SITES}:${userId}`;
    return await this.get(key);
  }

  async setUserSites(userId: string, sites: any): Promise<boolean> {
    const key = `${CACHE_KEYS.USER_SITES}:${userId}`;
    return await this.set(key, sites, { ttl: CACHE_TTL.DASHBOARD_MEDIUM });
  }

  async invalidateUserSites(userId: string): Promise<void> {
    const key = `${CACHE_KEYS.USER_SITES}:${userId}`;
    await this.delete(key);
    logger.info(`🗑️  Cache INVALIDATE: user sites for ${userId}`);
  }

  async getSitePages(siteId: string): Promise<any> {
    const key = `${CACHE_KEYS.SITE_PAGES}:${siteId}`;
    return await this.get(key);
  }

  async getUserSubStatus(userId: string): Promise<{isActive: boolean} | null> {
    const key = `${CACHE_KEYS.USER_SUB_STATUS}:${userId}`;
    return this.get<{isActive: boolean}>(key);
  }

  async setUserSubStatus(userId: string, isActive: boolean): Promise<boolean> {
    const key = `${CACHE_KEYS.USER_SUB_STATUS}:${userId}`;
    return this.set(key, {isActive}, { ttl: CACHE_TTL.USER_SUB_STATUS });
  }

  async invalidateUserSub(userId: string): Promise<void> {
    const key = `${CACHE_KEYS.USER_SUB_STATUS}:${userId}`;
    await this.delete(key);
  }

  async setSitePages(siteId: string, pages: any): Promise<boolean> {
    const key = `${CACHE_KEYS.SITE_PAGES}:${siteId}`;
    return await this.set(key, pages, { ttl: CACHE_TTL.DASHBOARD_MEDIUM });
  }

  async invalidateSitePages(siteId: string): Promise<void> {
    const key = `${CACHE_KEYS.SITE_PAGES}:${siteId}`;
    await this.delete(key);
    logger.info(`🗑️  Cache INVALIDATE: site pages for ${siteId}`);
  }

  async getPageAnalysis(pageId: string): Promise<any> {
    const key = `${CACHE_KEYS.PAGE_ANALYSIS}:${pageId}`;
    return await this.get(key);
  }

  async setPageAnalysis(pageId: string, analysis: any): Promise<boolean> {
    const key = `${CACHE_KEYS.PAGE_ANALYSIS}:${pageId}`;
    return await this.set(key, analysis, { ttl: CACHE_TTL.DASHBOARD_LONG });
  }

  async invalidatePageAnalysis(pageId: string): Promise<void> {
    const key = `${CACHE_KEYS.PAGE_ANALYSIS}:${pageId}`;
    await this.delete(key);
    logger.info(`🗑️  Cache INVALIDATE: page analysis for ${pageId}`);
  }

  /**
   * RATE LIMITING
   */
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number = CACHE_TTL.RATE_LIMIT_WINDOW): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = `${CACHE_KEYS.RATE_LIMIT}:${identifier}`;
    
    try {
      const current = await redis.incr(key);
      if (!current) {
        // If incr fails, fail open
        return { allowed: true, remaining: limit, resetTime: Date.now() + (windowSeconds * 1000) };
      }
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      
      const remaining = Math.max(0, limit - current);
      const resetTime = Date.now() + (windowSeconds * 1000);
      
      return {
        allowed: current <= limit,
        remaining,
        resetTime
      };
    } catch (error) {
      logger.error(`Rate limit check error for ${identifier}: ${error}`);
      // Fail open - allow request if Redis is down
      return { allowed: true, remaining: limit, resetTime: Date.now() + (windowSeconds * 1000) };
    }
  }

  /**
   * EVENT BUFFERING for Analytics
   */
  async bufferTrackerEvent(siteId: string, eventData: any): Promise<boolean> {
    const key = `${CACHE_KEYS.TRACKER_EVENTS}:${siteId}`;
    const serializedEvent = JSON.stringify({
      ...eventData,
      timestamp: new Date().toISOString(),
      bufferedAt: Date.now()
    });
    
    const success = await redis.lpush(key, serializedEvent);
    if (success) {
      logger.debug(`📊 Event buffered for site ${siteId}`);
    }
    return success;
  }

  async getBufferedEvents(siteId: string, count: number = 100): Promise<any[]> {
    const key = `${CACHE_KEYS.TRACKER_EVENTS}:${siteId}`;
    const events = await redis.lrange(key, 0, count - 1);
    
    return events.map(event => {
      try {
        return JSON.parse(event);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  async removeBufferedEvents(siteId: string, count: number): Promise<boolean> {
    const key = `${CACHE_KEYS.TRACKER_EVENTS}:${siteId}`;
    return await redis.ltrim(key, count, -1);
  }

  /**
   * SESSION CACHING
   */
  async getSession(sessionId: string): Promise<any> {
    const key = `${CACHE_KEYS.SESSION}:${sessionId}`;
    return await this.get(key);
  }

  async setSession(sessionId: string, sessionData: any): Promise<boolean> {
    const key = `${CACHE_KEYS.SESSION}:${sessionId}`;
    return await this.set(key, sessionData, { ttl: CACHE_TTL.SESSION });
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const key = `${CACHE_KEYS.SESSION}:${sessionId}`;
    return await this.delete(key);
  }

  /**
   * CACHE WARMING - Preload frequently accessed data
   */
  async warmCache(operations: Array<() => Promise<void>>): Promise<void> {
    logger.info('🔥 Starting cache warming...');
    
    await Promise.allSettled(
      operations.map(async (operation, index) => {
        try {
          await operation();
          logger.debug(`✅ Cache warm operation ${index + 1} completed`);
        } catch (error) {
          logger.error(`❌ Cache warm operation ${index + 1} failed: ${error}`);
        }
      })
    );
    
    logger.info('🔥 Cache warming completed');
  }

  /**
   * CACHE STATISTICS
   */
  async getCacheStats(): Promise<{ redis: boolean; operations: any }> {
    const redisHealthy = await redis.ping();
    
    return {
      redis: redisHealthy,
      operations: {
        // Could add counters for cache hits/misses here
      }
    };
  }
}

// Create singleton instance
const cache = new CacheService();

export default cache;
export { CacheService }; 