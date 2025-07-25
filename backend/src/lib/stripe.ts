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

  async getSubscription(subscriptionId: string) {
    const subscription = await this.stripe.subscriptions.retrieve(
      subscriptionId
    );
    return subscription;
  }

  async createCheckoutSession(input: {
    customer: string;
    line_items: { price: string; quantity: number }[];
    mode: "subscription" | "payment";
    success_url: string;
    cancel_url: string;
  }) {
    const checkoutSession = await this.stripe.checkout.sessions.create({
      customer: input.customer,
      line_items: input.line_items,
      mode: input.mode || "subscription",
      success_url: input.success_url,
      cancel_url: input.cancel_url,
    });

    return checkoutSession;
  }

  async updateSubscription(
    subscriptionId: string,
    input: {
      items: { price: string; quantity: number }[];
    }
  ) {
    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        items: input.items,
        proration_behavior: "always_invoice",
      }
    );

    return subscription;
  }

  async getProductPrice(type: string): Promise<string> {
    const products = await this.stripe.products.list({ active: true });
    const product = products.data.find((item) => item.metadata.type === type);

    if (!product) {
      throw new Error("Product not found");
    }

    const price = await this.stripe.prices.list({
      product: product.id,
      active: true,
    });

    return price.data[0].id;
  }
}
