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
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

const sitemapWorker = new Worker('sitemap-import', async (job) => {
  logger.info(`Processing sitemap import job: ${JSON.stringify(job.data)}`);
  const { siteId, sitemapUrl } = job.data;
  try {
    const response = await axios.get(sitemapUrl, { timeout: 10000 });
    const xml = response.data;
    const parsed = await parseStringPromise(xml);
    // Extract URLs from sitemap (basic urlset)
    const urls = (parsed.urlset?.url || []).map((u: any) => u.loc[0]);
    logger.info(`Found ${urls.length} URLs in sitemap for site ${siteId}`);
    let upserted = 0;
    for (const url of urls) {
      // Upsert: insert if not exists for this siteId+url
      const existing = await db.select().from(pages).where(and(eq(pages.siteId, siteId), eq(pages.url, url))).limit(1);
      if (existing.length === 0) {
        await db.insert(pages).values({ siteId, url }).onConflictDoNothing();
        upserted++;
      }
    }
    logger.info(`Upserted ${upserted} new pages for site ${siteId}`);
    return { status: 'done', urlCount: urls.length, upserted };
  } catch (err) {
    logger.error(`Sitemap import job failed: ${err}`);
    throw err;
  }
}, { connection: redisConnection });

sitemapWorker.on('completed', (job) => {
  logger.info(`Sitemap import job ${job.id} completed.`);
});

sitemapWorker.on('failed', (job, err) => {
  logger.error(`Sitemap import job ${job?.id} failed: ${err}`);
}); 