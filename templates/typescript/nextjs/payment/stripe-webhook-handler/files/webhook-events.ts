import type Stripe from 'stripe';
import { upsertSubscription, deleteSubscription } from '@/lib/stripe-db';
import type { WebhookEventHandlers } from './webhook-types';

export const defaultHandlers: WebhookEventHandlers = {
  'checkout.session.completed': async (session: Stripe.Checkout.Session) => {
    // TODO: Fulfill order, send confirmation email
    console.log('Checkout completed:', session.id);
  },

  'customer.subscription.created': async (subscription: Stripe.Subscription) => {
    await upsertSubscription(subscription);
  },

  'customer.subscription.updated': async (subscription: Stripe.Subscription) => {
    await upsertSubscription(subscription);
  },

  'customer.subscription.deleted': async (subscription: Stripe.Subscription) => {
    await deleteSubscription(subscription.id);
  },

  'invoice.paid': async (invoice: Stripe.Invoice) => {
    console.log('Invoice paid:', invoice.id, 'Amount:', invoice.amount_paid);
  },

  'invoice.payment_failed': async (invoice: Stripe.Invoice) => {
    // TODO: Send dunning email, update subscription status
    console.log('Payment failed:', invoice.id);
  },
};
