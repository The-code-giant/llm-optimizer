import { Router, Response, NextFunction, Request } from "express";
import { authenticateJWT } from "../middleware/auth";
import { db } from "../db/client";
import { userSubscriptions } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { StripeClient } from "../lib/stripe";
import z from "zod";

interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
}

const router = Router();

const changePlanSchema = z.object({
  type: z.string().min(2),
});

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

      let subscription = userActiveSubscription?.[0];

      if (!subscription) {
        //? is this is an edge case?
        //! fallback for user who created account before we had a paid plan.
        subscription = {
          subscriptionType: "free",
          createdAt: new Date(),
        } as any;
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

router.post(
  "/",
  authenticateJWT,
  async (req: Request, res: Response, next: NextFunction) => {
    const authenticatedReq = req as AuthenticatedRequest;

    const parse = changePlanSchema.safeParse(req.body);

    if (!parse.success) {
      res
        .status(400)
        .json({ message: "Invalid input", errors: parse.error.errors });
      return;
    }

    try {
      const userId = authenticatedReq.user?.userId as string;

      const { type } = parse.data;

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

      let currentActiveSubscription = userActiveSubscription?.[0];

      if (!currentActiveSubscription) {
        //? is this is an edge case?
        //! fallback for user who created account before we had a paid plan.
        currentActiveSubscription = {
          subscriptionType: "free",
          createdAt: new Date(),
        } as any;
      }

      const stripe = new StripeClient();

      const productPrice = await stripe.getProductPrice(type);

      if (currentActiveSubscription.subscriptionType !== "free") {
        const subInStripe = await stripe.getSubscription(
          currentActiveSubscription.stripeSubscriptionId as string
        );

        if (subInStripe.status === "active") {
          // user is already on a paid plan and they are upgrading to a different plan.
          // we need to update the current subscription to the new plan.

          await stripe.updateSubscription(
            currentActiveSubscription.stripeSubscriptionId as string,
            {
              items: [{ price: productPrice, quantity: 1 }],
            }
          );

          res.status(200).json({ isUpgrade: true, redirectUrl: "" });
          return;
        }
      }

      // create a new subscription with the new plan checkout session.

      const checkoutSession = await stripe.createCheckoutSession({
        customer: currentActiveSubscription.stripeCustomerId as string,
        line_items: [{ price: productPrice, quantity: 1 }],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=false`,
      });

      res.status(200).json({ redirectUrl: checkoutSession.url });
      return;
    } catch (err) {
      next(err);
    }
  }
);

export default router;
