import type Stripe from 'stripe';

export type WebhookEventHandler<T = Stripe.Event.Data.Object> = (
  data: T,
  event: Stripe.Event
) => Promise<void>;

export interface WebhookEventHandlers {
  'checkout.session.completed'?: WebhookEventHandler<Stripe.Checkout.Session>;
  'checkout.session.expired'?: WebhookEventHandler<Stripe.Checkout.Session>;
  'customer.subscription.created'?: WebhookEventHandler<Stripe.Subscription>;
  'customer.subscription.updated'?: WebhookEventHandler<Stripe.Subscription>;
  'customer.subscription.deleted'?: WebhookEventHandler<Stripe.Subscription>;
  'invoice.paid'?: WebhookEventHandler<Stripe.Invoice>;
  'invoice.payment_failed'?: WebhookEventHandler<Stripe.Invoice>;
  'payment_intent.succeeded'?: WebhookEventHandler<Stripe.PaymentIntent>;
  'payment_intent.payment_failed'?: WebhookEventHandler<Stripe.PaymentIntent>;
  'customer.created'?: WebhookEventHandler<Stripe.Customer>;
  'customer.deleted'?: WebhookEventHandler<Stripe.Customer>;
  [key: string]: WebhookEventHandler | undefined;
}

export interface WebhookResult {
  received: boolean;
  type: string;
  processed: boolean;
}
