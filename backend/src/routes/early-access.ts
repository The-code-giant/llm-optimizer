import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { writeToGoogleSheet } from '../lib/google-sheets-api';


const router = Router();

const EarlyAccessSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyWebsite: z.string().min(1),
  companyEmail: z.string().email(),
  phoneNumber: z.string().optional(),
});

/**
 * @openapi
 * /api/v1/early-access:
 *   post:
 *     summary: Create a new early access request
 *     tags: [EarlyAccess]
 */
router.post('/', async (req: Request, res: Response) => {
  const parsed = EarlyAccessSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid early access request payload', issues: parsed.error.issues });
    return;
  }

  try {
    const result = await writeToGoogleSheet(parsed.data);

    if (!result.success) {
      res.status(400).json({success: false, message: result.message });
      return;
    }

    res.status(200).json({success: true, message: result.message });
    return;

  } catch (error) {
    console.error('Failed to submit early access request', error);
    res.status(500).json({ message: 'Failed to submit early access request' });
    return;
  }

});


export default router;