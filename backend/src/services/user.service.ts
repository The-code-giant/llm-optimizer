import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { db } from "../db/client";
import { StripeClient } from "../lib/stripe";

export class UserService {
  async ensureUserExists(userId: string, email: string) : Promise<void> {
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

          console.log(
            "stripeCustomerId new customer created",
            stripeCustomerId
          );
        }
      }
    } catch (error) {
      // User might already exist due to concurrent requests, ignore duplicate key errors
      if (!(error as any)?.constraint) {
        console.error("Error ensuring user exists:", error);
        throw error;
      }
    }
  }
}

export const userService = new UserService();