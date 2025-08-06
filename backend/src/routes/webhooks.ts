import { NextFunction, Router } from "express";
import { Request, Response } from "express";
import { StripeClient } from "../lib/stripe";
import Stripe from "stripe";
import { userSubscriptions } from "../db/schema";
import { db } from "../db/client";
import { eq } from "drizzle-orm";
import cache from "../utils/cache";

const router = Router();

const handleSubscriptionCreated = async (event: Stripe.Event) => {
  const subscription = event.data.object as Stripe.Subscription;

  const subscriptionID = subscription.id;
  const productID = subscription.items.data[0].price.product as string;


  const stripe = new StripeClient();

  const findCustomer = await stripe.getCustomer(
    subscription.customer as string
  );

  const userId = findCustomer.metadata?.userId;


  if(subscription.status === "trialing"){

    await db.insert(userSubscriptions).values({
      userId: userId,
      stripeSubscriptionId: subscriptionID,
      stripeCustomerId: subscription.customer as string,
      subscriptionType: "free",
      isActive: 1,
    })

    return;
  }

  // update previous subscription to inactive.
  await db
    .update(userSubscriptions)
    .set({
      isActive: 0,
    })
    .where(eq(userSubscriptions.userId, userId));

  // create a new active subscription in our database.

  const product = await stripe.getProduct(productID);
  const productName = product.name.toLowerCase().includes("pro")
    ? "pro"
    : "enterprise";

  await db.insert(userSubscriptions).values({
    userId: userId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscriptionID,
    isActive: 1,
    subscriptionType: productName as "pro" | "enterprise",
  });

  await cache.invalidateUserSub(userId);
};

const handleSubscriptionUpdated = async (event: Stripe.Event) => {
  const subscription = event.data.object as Stripe.Subscription;

  const subscriptionID = subscription.id;
  // last product subscription
  const productID = subscription.items.data[subscription.items.data.length - 1].price.product as string;

  const stripe = new StripeClient();
  const product = await stripe.getProduct(productID);

  const productName = product.name.toLowerCase().includes("pro")
  ? "pro"
  : "enterprise";

  await db.update(userSubscriptions).set({
    subscriptionType: productName as "pro" | "enterprise",
  }).where(eq(userSubscriptions.stripeSubscriptionId, subscriptionID));

  console.log( "subscription updated", subscriptionID)

  const findSub = await db.query.userSubscriptions.findFirst({
    where : eq(userSubscriptions.stripeSubscriptionId, subscriptionID)
  })

  if(findSub){
    await cache.invalidateUserSub(findSub.userId);
  }
}

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
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event);
        break;
    }

    res.sendStatus(200);
  }
);

export default router;
