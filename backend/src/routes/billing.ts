import { Router, Response, NextFunction, Request } from "express";
import { authenticateJWT } from "../middleware/auth";
import { db } from "../db/client";
import { userSubscriptions } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { StripeClient } from "../lib/stripe";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

router.get(
  "/",
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = authenticatedReq.user?.userId as string;

      const userActiveSubscription = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.isActive, 1)
          )
        )
        .orderBy(desc(userSubscriptions.createdAt))
        .limit(1);

      const subscription = userActiveSubscription[0];

      if (!subscription) {
        throw new Error("User does not have an active subscription");
      }

      if (subscription.subscriptionType === "free") {
        // next billing would be 7 days after user subscription was created.
        res.status(200).json({
          type: "Free",
          nextBilling: new Date(
            new Date(subscription.createdAt as Date).getTime() +
              7 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });
        return;
      }
      // if subscription is not free, we need to get the next billing date from the subscription.

      const stripe = new StripeClient();

      const subscriptionInStripe = await stripe.getSubscription(
        subscription.stripeSubscriptionId as string
      );

      console.log(subscriptionInStripe.next_pending_invoice_item_invoice);

      res.status(200).json({
        type: subscription,
        nextBilling: new Date(
          (subscriptionInStripe.next_pending_invoice_item_invoice as number) *
            1000
        ).toISOString(),
      });
      return;
    } catch (err) {
      next(err);
    }
  }
);

export default router;
