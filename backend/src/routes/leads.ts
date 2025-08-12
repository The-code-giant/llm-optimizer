import express, { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { leads } from '../db/schema';

const router = express.Router();

const LeadSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(64).optional(),
  website: z.string().url(),
  source: z.string().max(64).optional(),
  meta: z.any().optional(),
});

/**
 * @openapi
 * /api/v1/leads:
 *   post:
 *     summary: Create a new lead
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               website: { type: string, format: uri }
 *               source: { type: string }
 *               meta: { type: object }
 *     responses:
 *       200:
 *         description: Lead stored
 */
router.post('/', async (req: Request, res: Response) => {
  const parsed = LeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid lead payload', issues: parsed.error.issues });
    return;
  }
  const { email, phone, website, source, meta } = parsed.data;
  try {
    // Minimal IP and UA capture
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';
    const refererHeader = req.get('referer') || '';
    const originHeader = req.get('origin') || '';
    const xfProto = req.get('x-forwarded-proto') || 'http';
    const xfHost = req.get('x-forwarded-host') || req.get('host') || '';
    const apiEndpoint = `${xfProto}://${xfHost}${req.originalUrl}`;

    const parseUtm = (u: string) => {
      try {
        const url = new URL(u);
        const params = url.searchParams;
        const keys = ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'];
        const out: Record<string, string> = {};
        keys.forEach(k => {
          const v = params.get(k);
          if (v) out[k] = v;
        });
        return out;
      } catch { return {}; }
    };

    // Basic referer parsing and traffic classification
    const parseReferer = (u: string) => {
      try {
        const url = new URL(u);
        const host = url.hostname;
        const path = url.pathname;
        const qp = url.searchParams;
        const q = qp.get('q') || qp.get('query') || '';
        const searchDomains = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'yandex.', 'baidu.'];
        const socialDomains = ['facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com', 't.co', 'reddit.com', 'pinterest.', 'threads.net'];
        let type: 'search' | 'social' | 'ads' | 'referral' | 'direct' = 'referral';
        if (!u) type = 'direct';
        else if (searchDomains.some((d) => host.includes(d))) type = 'search';
        else if (socialDomains.some((d) => host.includes(d))) type = 'social';
        const hasAdParams = !!(qp.get('gclid') || qp.get('fbclid') || qp.get('msclkid'));
        if (hasAdParams) type = 'ads';
        return { host, path, type, searchQuery: q };
      } catch {
        const t: 'referral' | 'direct' = u ? 'referral' : 'direct';
        return { host: '', path: '', type: t, searchQuery: '' };
      }
    };

    const metaCombined = {
      ...(meta || {}),
      server: {
        refererHeader,
        originHeader,
        apiEndpoint,
        receivedAt: new Date().toISOString(),
        utmFromReferer: parseUtm(refererHeader),
        referer: parseReferer(refererHeader),
      },
    };

    await db.insert(leads).values({
      email,
      phone,
      website,
      source: source || 'tools',
      meta: metaCombined,
      ipAddress: ip,
      userAgent: ua,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Failed to store lead' });
  }
});

export default router;


