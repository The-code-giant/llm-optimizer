import Stripe from "stripe";

export class StripeClient {
  stripe: Stripe;

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
      subscriptionId,
      {
        expand: ["items.data.price.product"],
      }
    );
    return subscription;
  }

  async createCheckoutSession(input: {
    customer: string;
    line_items: { price: string; quantity: number }[];
    mode: "subscription" | "payment";
    success_url: string;
    cancel_url: string;
    userId: string;
  }) {
    const checkoutSession = await this.stripe.checkout.sessions.create({
      customer: input.customer,
      line_items: input.line_items,
      mode: input.mode || "subscription",
      success_url: input.success_url,
      cancel_url: input.cancel_url,
      metadata: {
        userId: input.userId,
      },
    });

    return checkoutSession;
  }

  async updateSubscription(
    subscriptionId: string,
    input: {
      items: { price: string; quantity: number }[];
    }
  ) {
      try{
    const subscription = await this.stripe.subscriptions.update(
      subscriptionId,
      {
        items: input.items,
        proration_behavior: "always_invoice",
      }
    );

    return subscription;
  }catch(error: any){
    console.error(
      `Error updating stripe subscription.`,
      error?.message
    );
    return null;
  }
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

  constructWebhookEvent(body: any, signature: string | string[] | undefined) {
    if (!signature) {
      throw new Error("Missing stripe signature");
    }
    return this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.retrieve(customerId);
    return customer as Stripe.Customer;
  }

  async getProduct(productId: string): Promise<Stripe.Product> {
    const product = await this.stripe.products.retrieve(productId);
    return product as Stripe.Product;
  }

  async getInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    const invoice = await this.stripe.invoices.retrieve(invoiceId);
    return invoice as Stripe.Invoice;
  }

  async getAllProducts() {
    return this.stripe.products.list({active : true })
  }
}
