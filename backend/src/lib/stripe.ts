import Stripe from "stripe";

export class StripeClient {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createCustomer(input: { email: string; userId: string }) {
    try {
      const { email, userId } = input;

      const customer = await this.stripe.customers.create({
        email,
        metadata: {
          userId: userId,
        },
      });
      return customer.id;
    } catch (error: any) {
      console.error(
        `Error creating stripe customer for user ${input.userId}`,
        error?.message
      );
      return null;
    }
  }
}
