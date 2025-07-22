import { Queue, WorkerOptions } from 'bullmq';

export const redisConnection = process.env.REDIS_URL
  ? { connection: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    };

const connection = { connection: redisConnection };

export const sitemapImportQueue = new Queue('sitemap-import', connection);
export const analysisQueue = new Queue('analysis', connection); 