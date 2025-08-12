import express, { Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';

const router = express.Router();

// Simple robots.txt parser to capture groups per user-agent
type RobotsGroup = {
  agents: string[];
  allow: string[];
  disallow: string[];
};

function parseRobotsTxt(content: string): RobotsGroup[] {
  const lines = content.split(/\r?\n/).map((l) => l.trim());
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | null = null;

  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const [rawKey, ...rest] = line.split(':');
    if (!rawKey || rest.length === 0) continue;
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(':').trim();

    if (key === 'user-agent') {
      // Start a new group if we hit a user-agent after having allow/disallow
      if (current && (current.allow.length > 0 || current.disallow.length > 0)) {
        groups.push(current);
        current = null;
      }
      if (!current) current = { agents: [], allow: [], disallow: [] };
      current.agents.push(value.toLowerCase());
      continue;
    }

    if (!current) continue; // rules before any user-agent are ignored

    if (key === 'allow') current.allow.push(value);
    if (key === 'disallow') current.disallow.push(value);
  }
  if (current) groups.push(current);
  return groups;
}

// Very simplified path permission check. Follows longest rule precedence between allow/disallow.
function isPathAllowedFor(groups: RobotsGroup[], agentToken: string, path: string): boolean | 'unknown' {
  const agent = agentToken.toLowerCase();
  const matchingGroups = groups.filter((g) => g.agents.includes(agent));
  const starGroups = groups.filter((g) => g.agents.includes('*'));
  const effectiveGroups = matchingGroups.length > 0 ? matchingGroups : starGroups;
  if (effectiveGroups.length === 0) return 'unknown';

  const rules = { allow: [] as string[], disallow: [] as string[] };
  for (const g of effectiveGroups) {
    rules.allow.push(...g.allow);
    rules.disallow.push(...g.disallow);
  }

  // Normalize and compute longest matching rule
  const normalizedPath = path || '/';
  const matches = (rule: string) => {
    if (rule === '') return true; // empty value means allow all / disallow nothing depending on directive
    if (rule === '/') return true;
    return normalizedPath.startsWith(rule);
  };

  let longestAllow = -1;
  for (const a of rules.allow) {
    if (matches(a)) longestAllow = Math.max(longestAllow, a.length);
  }
  let longestDisallow = -1;
  for (const d of rules.disallow) {
    if (matches(d)) longestDisallow = Math.max(longestDisallow, d.length);
  }

  if (longestAllow === -1 && longestDisallow === -1) return true; // no rules
  if (longestAllow >= longestDisallow) return true;
  return false;
}

const UrlSchema = z.object({
  url: z.string().url(),
});

// Common bots to test
const BOTS: { name: string; ua: string; token: string }[] = [
  {
    name: 'Googlebot',
    ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    token: 'googlebot',
  },
  { name: 'GPTBot (OpenAI)', ua: 'GPTBot/1.0 (+https://openai.com/gptbot)', token: 'gptbot' },
  { name: 'ClaudeBot (Anthropic)', ua: 'ClaudeBot/1.0 (+https://www.anthropic.com/claudebot)', token: 'claudebot' },
  { name: 'PerplexityBot', ua: 'PerplexityBot/1.0 (+https://www.perplexity.ai/bot)', token: 'perplexitybot' },
  { name: 'CCBot (CommonCrawl)', ua: 'CCBot/2.0 (+https://commoncrawl.org/faq/)', token: 'ccbot' },
  { name: 'Amazonbot', ua: 'Amazonbot/1.0 (+https://developer.amazon.com/support/amazonbot)', token: 'amazonbot' },
  { name: 'Meta-ExternalAgent', ua: 'Meta-ExternalAgent/1.0', token: 'meta-externalagent' },
  { name: 'Applebot', ua: 'Applebot/0.1 (+http://www.apple.com/go/applebot)', token: 'applebot' },
];

/**
 * @openapi
 * /api/v1/tools/bot-access-check:
 *   post:
 *     summary: Check whether common LLM and search bots can access a given URL
 *     tags: [Tools]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Accessibility check results per bot
 */
router.post('/bot-access-check', async (req: Request, res: Response) => {
  try {
    const parsed = UrlSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Invalid request body', issues: parsed.error.issues });
      return;
    }
    const targetUrl = new URL(parsed.data.url);
    const robotsUrl = `${targetUrl.protocol}//${targetUrl.host}/robots.txt`;

    // Fetch robots.txt (best-effort)
    let robotsTxt = '';
    let robotsFound = false;
    try {
      const robotsResp = await axios.get(robotsUrl, { timeout: 8000, validateStatus: () => true });
      if (robotsResp.status >= 200 && robotsResp.status < 300 && typeof robotsResp.data === 'string') {
        robotsTxt = robotsResp.data as string;
        robotsFound = true;
      }
    } catch (_) {
      // ignore
    }
    const groups = robotsTxt ? parseRobotsTxt(robotsTxt) : [];

    // Probe each bot
    const results = await Promise.all(
      BOTS.map(async (bot) => {
        let robotsAllowed: boolean | 'unknown' = 'unknown';
        try {
          robotsAllowed = robotsTxt ? isPathAllowedFor(groups, bot.token, targetUrl.pathname) : 'unknown';
        } catch (_) {}

        let httpStatus: number | null = null;
        let ok = false;
        let error: string | undefined;
        try {
          const resp = await axios.get(parsed.data.url, {
            timeout: 10000,
            headers: { 'User-Agent': bot.ua },
            maxRedirects: 3,
            validateStatus: () => true,
          });
          httpStatus = resp.status;
          ok = resp.status >= 200 && resp.status < 400;
        } catch (e: any) {
          error = e?.message || 'Request failed';
        }

        return { agent: bot.name, userAgent: bot.ua, robotsAllowed, httpStatus, ok, error };
      })
    );

    res.json({
      url: parsed.data.url,
      robotsTxtUrl: robotsUrl,
      robotsTxtFound: robotsFound,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
});

export default router;


