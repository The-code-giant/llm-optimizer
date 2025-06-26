import { Worker } from 'bullmq';
import { redisConnection } from './queue';
import winston from 'winston';
import { db } from '../db/client';
import { pages, analysisResults } from '../db/schema';
import { eq } from 'drizzle-orm';
import axios from 'axios';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()],
});

async function analyzePage(pageId: string) {
  const pageArr = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
  const page = pageArr[0];
  if (!page) throw new Error(`Page ${pageId} not found`);
  // Use page.contentSnapshot as the prompt, or fallback
  const prompt = page.contentSnapshot || `Analyze the following page for LLM readiness: ${page.url}`;
  logger.info(`Calling OpenAI API for page ${pageId}...`);
  let llmResponse = null;
  try {
    const openaiRes = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an SEO and LLM optimization expert.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 512,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    llmResponse = openaiRes.data;
    logger.info(`OpenAI response for page ${pageId}: ${JSON.stringify(llmResponse)}`);
  } catch (err) {
    logger.error(`OpenAI API call failed for page ${pageId}: ${err}`);
    throw err;
  }
  // Parse LLM response (stub: just use the text)
  const text = llmResponse?.choices?.[0]?.message?.content || '';
  // Mock score and recommendations from LLM output
  const score = Math.floor(Math.random() * 100);
  const recommendations = [
    { type: 'llm', message: text.slice(0, 100) },
  ];
  await db.insert(analysisResults).values({
    pageId,
    score,
    recommendations: JSON.stringify(recommendations),
    rawLlmOutput: JSON.stringify(llmResponse),
  });
  logger.info(`Stored analysis result for page ${pageId}`);
}

const analysisWorker = new Worker('analysis', async (job) => {
  logger.info(`Processing analysis job: ${JSON.stringify(job.data)}`);
  if (job.name === 'site-analysis') {
    // Analyze all pages for the site
    const { siteId } = job.data;
    const sitePages = await db.select().from(pages).where(eq(pages.siteId, siteId));
    for (const page of sitePages) {
      await analyzePage(page.id);
    }
    logger.info(`Completed analysis for all pages in site ${siteId}`);
    return { status: 'done', analyzed: sitePages.length };
  } else if (job.name === 'page-analysis') {
    const { pageId } = job.data;
    await analyzePage(pageId);
    logger.info(`Completed analysis for page ${pageId}`);
    return { status: 'done', analyzed: 1 };
  }
  return { status: 'skipped' };
}, { connection: redisConnection });

analysisWorker.on('completed', (job) => {
  logger.info(`Analysis job ${job.id} completed.`);
});

analysisWorker.on('failed', (job, err) => {
  logger.error(`Analysis job ${job?.id} failed: ${err}`);
}); 