import { NextFunction, Router } from "express";
import { Request, Response } from "express";
import { StripeClient } from "../lib/stripe";
import Stripe from "stripe";
import { userSubscriptions } from "../db/schema";
import { db } from "../db/client";
import { eq } from "drizzle-orm";

const router = Router();

const handleSubscriptionCreated = async (event: Stripe.Event) => {
  const subscription = event.data.object as Stripe.Subscription;

  const subscriptionID = subscription.id;
  const productID = subscription.items.data[0].price.product as string;

  const stripe = new StripeClient();

  const product = await stripe.getProduct(productID);

  const productName = product.name.toLowerCase().includes("pro")
    ? "pro"
    : "enterprise";

  const findCustomer = await stripe.getCustomer(
    subscription.customer as string
  );

  const userId = findCustomer.metadata?.userId;

  // update previous subscription to inactive.
  await db
    .update(userSubscriptions)
    .set({
      isActive: 0,
    })
    .where(eq(userSubscriptions.userId, userId));

  // create a new active subscription in our database.
  await db.insert(userSubscriptions).values({
    userId: userId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscriptionID,
    isActive: 1,
    subscriptionType: productName as "pro" | "enterprise",
  });

};

router.post(
  "/stripe",
  async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers["stripe-signature"];

    const stripe = new StripeClient();

    const event = stripe.constructWebhookEvent((req as any).rawBody, sig);

    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event);
        break;
    }

    res.sendStatus(200);
  }
);

export default router;
