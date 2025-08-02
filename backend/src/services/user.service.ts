import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { db } from "../db/client";
import { StripeClient } from "../lib/stripe";

export class UserService {
  currentCheckingUsers: string[] = [];

  async ensureUserExists(userId: string, email: string) : Promise<void> {

    if(this.currentCheckingUsers.includes(userId)){
      return;
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
}

export const userService = new UserService();