import { Router, Response, NextFunction, Request } from "express";
import { authenticateJWT } from "../middleware/auth";
import { db } from "../db/client";
import { userSubscriptions, users } from "../db/schema";
import { and, desc, eq } from "drizzle-orm";
import { StripeClient } from "../lib/stripe";
import z from "zod";
import { userService } from "../services/user.service";
import cache from "../utils/cache";

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

      let userActiveSubscription = await db
        .select()
        .from(userSubscriptions)
        .where(
          and(
            eq(userSubscriptions.userId, userId),
            eq(userSubscriptions.isActive, 1)
          )
        )
        .orderBy(desc
          (userSubscriptions.createdAt))
        .limit(1);

      let subscription = userActiveSubscription?.[0];
      const stripe = new StripeClient();

      // If no active subscription record yet, ensure user exists (creates Stripe customer and trial sub via webhook)
      if (!subscription) {
        try {
          await userService.ensureUserExists(userId, authenticatedReq.user?.email as string);
          userActiveSubscription = await db
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
          subscription = userActiveSubscription?.[0];
        } catch (e) {
          // fall through to safe default response
        }
      }

      if (subscription?.stripeSubscriptionId) {

        const subscriptionInStripe = await stripe.getSubscription(
          subscription.stripeSubscriptionId as string
        );

        if (subscriptionInStripe.trial_end && subscriptionInStripe.status === "trialing") {
          res.status(200).json({
            type: "trial",
            nextBilling: new Date(
              (subscriptionInStripe.trial_end as number) *
              1000
            ).toISOString(),
            isActive: subscriptionInStripe.trial_end > Math.floor(Date.now() / 1000),
            stripeStatus: subscriptionInStripe.status,
          });

          return;
        }

        res.status(200).json({
          type: subscription.subscriptionType,
          nextBilling: subscriptionInStripe.status === "active" ? new Date(
            (subscriptionInStripe.items.data[subscriptionInStripe.items.data.length - 1].current_period_end as number) *
            1000
          ).toISOString() : null,
          isActive: subscriptionInStripe.status === "active",
          stripeStatus: subscriptionInStripe.status,
        });


        return;
      }

      // If still no subscription info, return a safe default (free/trial)
      res.status(200).json({
        type: subscription?.subscriptionType || "free",
        nextBilling: null,
        isActive: true,
        stripeStatus: "trialing",
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
      const userEmail = authenticatedReq.user?.email as string;

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

      const currentActiveSubscription = userActiveSubscription?.[0];

      const stripe = new StripeClient();
      const productPrice = await stripe.getProductPrice(type);

      // Resolve stripeCustomerId from current subscription or users table, or create if missing
      let stripeCustomerId: string | undefined = currentActiveSubscription?.stripeCustomerId as string | undefined;
      if (!stripeCustomerId) {
        const userRecordArr = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        const userRecord = userRecordArr[0];
        stripeCustomerId = userRecord?.stripeCustomerId || undefined;
      }
      if (!stripeCustomerId) {
        // Ensure the user exists and has a Stripe customer
        try {
          await userService.ensureUserExists(userId, userEmail);
          const refreshedUserArr = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
          const refreshedUser = refreshedUserArr[0];
          stripeCustomerId = refreshedUser?.stripeCustomerId || undefined;
        } catch (err) {
          console.error("Error ensuring user and stripe customer existence:", err);
        }
      }

      if (!stripeCustomerId) {
        res.status(500).json({ message: "Stripe customer not found for user" });
        return;
      }

      if (currentActiveSubscription?.subscriptionType === "free") {
        // update the free trial subscription to the new plan.

        const checkoutSession = await stripe.stripe.checkout.sessions.create({
          customer: stripeCustomerId,
          line_items: [{ price: productPrice, quantity: 1 }],
          mode: "subscription",
          allow_promotion_codes: true,
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=false`,
          metadata: {
            userId: userId,
          },
        });

        res.status(200).json({ redirectUrl: checkoutSession.url });
        return;
      }

      if (currentActiveSubscription?.stripeSubscriptionId) {
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
        customer: stripeCustomerId,
        line_items: [{ price: productPrice, quantity: 1 }],
        mode: "subscription",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=false`,
        userId: userId,
      });

      res.status(200).json({ redirectUrl: checkoutSession.url });
      return;
    } catch (err) {
      console.error(
        `Error updating stripe subscription.`,
        err
      );
      next(err);
    }
  }
);

router.get("/check-sub-status", authenticateJWT, async (req: Request, res: Response, next: NextFunction) => {

  const authenticatedReq = req as AuthenticatedRequest;
  const userId = authenticatedReq.user?.userId as string;
  
  const {isNewUser} = await userService.ensureUserExists(userId , authenticatedReq.user?.email as string);
  
  if(isNewUser){
    res.status(200).json({ isActive : true });
    return;
  }
  
  const isActive = await userService.isUserSubIsActive(userId);

  res.status(200).json({ isActive });
});

export default router;
