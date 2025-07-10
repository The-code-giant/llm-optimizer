import { Worker } from 'bullmq';
import { redisConnection } from './queue';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import winston from 'winston';
import { db } from '../db/client';
import { pages } from '../db/schema';
import { eq, and } from 'drizzle-orm';
// TODO: Import db and pages from your ORM setup
// import { db } from '../db/client';
// import { pages } from '../db/schema';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

const sitemapWorker = new Worker('sitemap-import', async (job) => {
  logger.info(`🚀 Processing sitemap import job ${job.id} for site: ${job.data.siteId}`);
  const { siteId, sitemapUrl } = job.data;
  
  try {
    // Fetch sitemap
    logger.info(`📥 Fetching sitemap from: ${sitemapUrl}`);
    const response = await axios.get(sitemapUrl, { 
      timeout: 30000,
      headers: {
        'User-Agent': 'Cleaver-Search/1.0 (Sitemap Crawler)'
      }
    });
    
    const xml = response.data;
    logger.info(`📄 Downloaded sitemap (${xml.length} characters)`);
    
    // Parse XML
    const parsed = await parseStringPromise(xml);
    
    // Extract URLs from sitemap (handle both urlset and sitemapindex)
    let urls: string[] = [];
    
    if (parsed.urlset?.url) {
      // Standard sitemap
      urls = parsed.urlset.url.map((u: any) => u.loc[0]);
    } else if (parsed.sitemapindex?.sitemap) {
      // Sitemap index - extract sitemap URLs (we'll need to handle this differently)
      urls = parsed.sitemapindex.sitemap.map((s: any) => s.loc[0]);
      logger.info(`⚠️  Found sitemap index with ${urls.length} sitemaps. Processing first-level URLs only.`);
    } else {
      throw new Error('Invalid sitemap format: no urlset or sitemapindex found');
    }
    
    logger.info(`🔍 Found ${urls.length} URLs in sitemap`);
    
    if (urls.length === 0) {
      logger.warn(`⚠️  No URLs found in sitemap for site ${siteId}`);
      return { status: 'done', urlCount: 0, upserted: 0 };
    }
    
    let upserted = 0;
    const batchSize = 50;
    
    // Process URLs in batches
    for (let i = 0; i < urls.length; i += batchSize) { 
      const batch = urls.slice(i, i + batchSize);
      logger.info(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(urls.length/batchSize)} (${batch.length} URLs)`);
      
      for (const url of batch) {
        try {
          // Check if page already exists
          const existing = await db.select()
            .from(pages)
            .where(and(eq(pages.siteId, siteId), eq(pages.url, url)))
            .limit(1);
          
          if (existing.length === 0) {
            // Extract potential title from URL path
            const urlPath = new URL(url).pathname;
            const potentialTitle = urlPath
              .split('/')
              .filter(segment => segment.length > 0)
              .pop()
              ?.replace(/[-_]/g, ' ')
              ?.replace(/\.(html|htm|php)$/, '')
              ?.replace(/\b\w/g, l => l.toUpperCase()) || 'Untitled Page';
            
            await db.insert(pages).values({
              siteId,
              url,
              title: potentialTitle,
              llmReadinessScore: 0, // Default score, will be updated when analyzed
            });
            
            upserted++;
          }
        } catch (pageError) {
          logger.error(`❌ Failed to insert page ${url}: ${pageError}`);
          // Continue with other pages
        }
      }
    }
    
    logger.info(`✅ Sitemap import completed! Imported ${upserted} new pages for site ${siteId}`);
    return { status: 'done', urlCount: urls.length, upserted };
    
  } catch (err: any) {
    logger.error(`❌ Sitemap import job ${job.id} failed: ${err.message}`);
    throw err;
  }
}, { 
  connection: redisConnection,
  concurrency: 1, // Process one sitemap at a time to avoid overwhelming the database
});

sitemapWorker.on('completed', (job, result) => {
  logger.info(`🎉 Sitemap import job ${job.id} completed successfully: ${JSON.stringify(result)}`);
});

sitemapWorker.on('failed', (job, err) => {
  logger.error(`💥 Sitemap import job ${job?.id} failed: ${err.message}`);
});

sitemapWorker.on('error', (err) => {
  logger.error(`⚠️  Sitemap worker error: ${err.message}`);
});

logger.info('🔄 Sitemap worker started and ready to process jobs');

export default sitemapWorker; 