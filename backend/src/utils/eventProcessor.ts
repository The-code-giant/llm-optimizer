import { Worker } from 'bullmq';
import { redisConnection } from './queue';
import { db } from '../db/client';
import { trackerData, pageAnalytics, sites } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import cache from './cache';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [EVENT-PROCESSOR-${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Background event processor for buffered tracker data
class EventProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private readonly intervalMs: number;
  
  constructor() {
    // Default to 5 hours; configurable via EVENT_PROCESSOR_INTERVAL_MS
    const defaultInterval = 1000 * 60 * 60 * 5; // 5 hours
    const envInterval = Number(process.env.EVENT_PROCESSOR_INTERVAL_MS || defaultInterval);
    this.intervalMs = Number.isFinite(envInterval) && envInterval > 0 ? envInterval : defaultInterval;
    logger.info(`⏱️  Event processor interval set to ${Math.round(this.intervalMs / (1000 * 60))} minutes`);
    this.startProcessor();
  }

  /**
   * Start the background processor that runs every 30 seconds
   */
  private startProcessor(): void {
    logger.info('🚀 Starting event processor background service');
    
    // Process immediately on startup
    setImmediate(() => this.processAllSites());
    
    // Then process on a fixed interval (configurable)
    this.intervalId = setInterval(() => {
      if (!this.isProcessing) {
        this.processAllSites();
      }
    }, this.intervalMs);
  }

  /**
   * Stop the background processor
   */
  public stopProcessor(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('⏹️  Event processor stopped');
    }
  }

  /**
   * Process buffered events for all sites
   */
  private async processAllSites(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Get all site IDs that might have buffered events
      // Note: In a production system, we might want to track active sites separately
      const sitesData = await db.select({ id: sites.id }).from(sites);
      
      let totalProcessed = 0;
      const batchPromises: Promise<number>[] = [];

      for (const siteRecord of sitesData) {
        // Process each site in parallel for better performance
        batchPromises.push(this.processSiteEvents(siteRecord.id));
      }

      // Wait for all site processing to complete
      const results = await Promise.allSettled(batchPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalProcessed += result.value;
        } else {
          logger.error(`Failed to process events for site ${sitesData[index]?.id}: ${result.reason}`);
        }
      });

      const duration = Date.now() - startTime;
      
      if (totalProcessed > 0) {
        logger.info(`✅ Processed ${totalProcessed} events across ${sitesData.length} sites in ${duration}ms`);
      }

    } catch (error) {
      logger.error(`❌ Event processor error: ${error}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process buffered events for a specific site
   */
  private async processSiteEvents(siteId: string): Promise<number> {
    try {
      const batchSize = 100;
      let totalProcessed = 0;
      let hasMoreEvents = true;

      while (hasMoreEvents) {
        // Get buffered events from Redis
        const events = await cache.getBufferedEvents(siteId, batchSize);
        
        if (events.length === 0) {
          hasMoreEvents = false;
          break;
        }

        // Process this batch
        const processed = await this.processBatch(siteId, events);
        totalProcessed += processed;

        // Remove processed events from buffer
        if (processed > 0) {
          await cache.removeBufferedEvents(siteId, processed);
        }

        // If we got fewer events than batch size, we're done
        if (events.length < batchSize) {
          hasMoreEvents = false;
        }
      }

      return totalProcessed;
    } catch (error) {
      logger.error(`Error processing events for site ${siteId}: ${error}`);
      return 0;
    }
  }

  /**
   * Process a batch of events and insert them into the database
   */
  private async processBatch(siteId: string, events: any[]): Promise<number> {
    if (events.length === 0) return 0;

    try {
      const validEvents: any[] = [];
      const analyticsUpdates: Map<string, any> = new Map();

      // Validate and prepare events
      for (const event of events) {
        try {
          // Validate required fields
          if (!event.pageUrl || !event.eventType) {
            logger.warn(`Skipping invalid event: missing required fields`);
            continue;
          }

          // Prepare tracker data insertion
          const trackerEvent = {
            siteId: event.siteId || siteId,
            pageUrl: event.pageUrl,
            eventType: event.eventType,
            eventData: event.eventData || {},
            sessionId: event.sessionId || null,
            anonymousUserId: event.anonymousUserId || null,
            userAgent: event.userAgent || 'unknown',
            ipAddress: event.ipAddress || 'unknown',
            referrer: event.referrer || '',
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          };

          validEvents.push(trackerEvent);

          // Aggregate page view events for analytics
          if (event.eventType === 'page_view') {
            const today = new Date().toISOString().split('T')[0];
            const analyticsKey = `${siteId}:${event.pageUrl}:${today}`;
            
            if (!analyticsUpdates.has(analyticsKey)) {
              analyticsUpdates.set(analyticsKey, {
                siteId,
                pageUrl: event.pageUrl,
                visitDate: today,
                pageViews: 0,
                loadTimes: [],
                contentInjected: false
              });
            }

            const analytics = analyticsUpdates.get(analyticsKey)!;
            analytics.pageViews += 1;
            
            if (event.eventData?.loadTime) {
              analytics.loadTimes.push(event.eventData.loadTime);
            }
            
            if (event.eventData?.contentInjected) {
              analytics.contentInjected = true;
            }
          }

        } catch (eventError) {
          logger.warn(`Error processing individual event: ${eventError}`);
        }
      }

      // Batch insert tracker data
      if (validEvents.length > 0) {
        try {
          await db.insert(trackerData).values(validEvents);
          logger.debug(`📊 Inserted ${validEvents.length} tracker events for site ${siteId}`);
        } catch (insertError) {
          logger.error(`Failed to insert tracker data: ${insertError}`);
          // Continue processing analytics even if tracker insert fails
        }
      }

      // Update page analytics
      await this.updateBatchAnalytics(analyticsUpdates);

      return validEvents.length;

    } catch (error) {
      logger.error(`Error processing batch for site ${siteId}: ${error}`);
      return 0;
    }
  }

  /**
   * Update page analytics for multiple pages in batch
   */
  private async updateBatchAnalytics(analyticsUpdates: Map<string, any>): Promise<void> {
    if (analyticsUpdates.size === 0) return;

    const promises: Promise<void>[] = [];

    for (const [key, analytics] of analyticsUpdates) {
      promises.push(this.updatePageAnalytics(analytics));
    }

    try {
      await Promise.allSettled(promises);
      logger.debug(`📈 Updated analytics for ${analyticsUpdates.size} page/date combinations`);
    } catch (error) {
      logger.error(`Error updating batch analytics: ${error}`);
    }
  }

  /**
   * Update page analytics for a single page/date combination
   */
  private async updatePageAnalytics(analytics: any): Promise<void> {
    try {
      const { siteId, pageUrl, visitDate, pageViews, loadTimes, contentInjected } = analytics;

      // Check if analytics record exists for this date
      const existing = await db
        .select()
        .from(pageAnalytics)
        .where(
          and(
            eq(pageAnalytics.siteId, siteId),
            eq(pageAnalytics.pageUrl, pageUrl),
            eq(pageAnalytics.visitDate, visitDate)
          )
        )
        .limit(1);

      const avgLoadTime = loadTimes.length > 0 
        ? Math.round(loadTimes.reduce((sum: number, time: number) => sum + time, 0) / loadTimes.length)
        : 0;

      if (existing.length > 0) {
        // Update existing record
        const current = existing[0];
        const newPageViews = (current.pageViews || 0) + pageViews;
        const newAvgLoadTime = current.loadTimeMs && avgLoadTime
          ? Math.round((current.loadTimeMs + avgLoadTime) / 2)
          : avgLoadTime || current.loadTimeMs;

        await db
          .update(pageAnalytics)
          .set({
            pageViews: newPageViews,
            loadTimeMs: newAvgLoadTime,
            contentInjected: contentInjected ? 1 : current.contentInjected,
            updatedAt: new Date()
          })
          .where(eq(pageAnalytics.id, current.id));

      } else {
        // Create new analytics record
        await db.insert(pageAnalytics).values({
          siteId,
          pageUrl,
          visitDate,
          pageViews,
          uniqueVisitors: 1, // This would need more sophisticated unique visitor tracking
          loadTimeMs: avgLoadTime,
          contentInjected: contentInjected ? 1 : 0,
          contentTypesInjected: [] // Could be enhanced to track specific content types
        });
      }

    } catch (error) {
      logger.error(`Error updating page analytics: ${error}`);
      // Don't throw - analytics updates shouldn't break event processing
    }
  }

  /**
   * Get processor statistics
   */
  public getStats(): { isProcessing: boolean; isRunning: boolean } {
    return {
      isProcessing: this.isProcessing,
      isRunning: this.intervalId !== null
    };
  }

  /**
   * Manual trigger for processing events (useful for testing or on-demand processing)
   */
  public async processNow(): Promise<void> {
    if (!this.isProcessing) {
      logger.info('🔄 Manual event processing triggered');
      await this.processAllSites();
    } else {
      logger.warn('⚠️  Event processing already in progress, skipping manual trigger');
    }
  }
}

// Create and export singleton instance
const eventProcessor = new EventProcessor();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, stopping event processor...');
  eventProcessor.stopProcessor();
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, stopping event processor...');
  eventProcessor.stopProcessor();
});

export default eventProcessor;
export { EventProcessor }; 