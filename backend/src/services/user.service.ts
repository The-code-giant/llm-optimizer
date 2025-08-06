import { and, eq } from "drizzle-orm";
import { users, userSubscriptions } from "../db/schema";
import { db } from "../db/client";
import { StripeClient } from "../lib/stripe";

export class UserService {
  currentCheckingUsers: string[] = [];

  async ensureUserExists(userId: string, email: string) : Promise<{isNewUser: boolean}> {
    let isNewUser = false;

    if(this.currentCheckingUsers.includes(userId)){
      return {isNewUser};
    }

    this.currentCheckingUsers.push(userId);


    try {
      // Try to find the user first
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (existingUser.length === 0) {
        // Create the user if they don't exist

        const stripeCustomerId = await new StripeClient().createCustomer({
          email: email,
          userId: userId,
        });

        await db.insert(users).values({
          id: userId,
          email: email,
          stripeCustomerId: stripeCustomerId ?? "",
        });

        await this.subscribeToProPlanTrial(userId, stripeCustomerId as string);
        isNewUser = true;
      } else {
        const user = existingUser[0];

        if (!user.stripeCustomerId) {
          const stripeCustomerId = await new StripeClient().createCustomer({
            email: email,
            userId: userId,
          });

          await db
            .update(users)
            .set({
              stripeCustomerId: stripeCustomerId ?? "",
            })
            .where(eq(users.id, userId));

          await this.subscribeToProPlanTrial(userId, stripeCustomerId as string);
        }
      }
    } catch (error) {
      // User might already exist due to concurrent requests, ignore duplicate key errors
      if (!(error as any)?.constraint) {
        console.error("Error ensuring user exists:", error);
        throw error;
      }
    }finally{
      this.currentCheckingUsers = this.currentCheckingUsers.filter(id => id !== userId);
    }

    return { isNewUser };
  }

  async subscribeToProPlanTrial(userId: string, stripeCustomerId: string) {
    const stripeClient = new StripeClient();
    const productPrice = await stripeClient.getProductPrice("pro");

    await stripeClient.stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: productPrice, quantity: 1 }],
      trial_period_days: 7,
      trial_settings: {
        end_behavior : {
          missing_payment_method: "cancel"
        }
      }
    });
  }

  async isUserSubIsActive(userId: string) {
    const userSub = await db.select().from(userSubscriptions).where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.isActive, 1))).limit(1);

    if(userSub.length === 0){
      return false;
    }

    try{
      const stripeClient = new StripeClient();
      const sub = await stripeClient.getSubscription(userSub[0].stripeSubscriptionId as string);

      return ["active", "trialing"].includes(sub.status);
    }catch(err){
      console.error("Error checking user sub is active:", err);
      return false
    }

  }
}

export const userService = new UserService();