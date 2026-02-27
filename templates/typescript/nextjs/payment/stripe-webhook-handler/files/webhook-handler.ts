import { stripe } from '@/lib/stripe';
import { isEventProcessed, markEventProcessed } from '@/lib/stripe-db';
import type { WebhookEventHandlers, WebhookResult } from './webhook-types';

export function createWebhookHandler(handlers: WebhookEventHandlers) {
  return async (body: string, signature: string): Promise<WebhookResult> => {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Idempotency check - skip if already processed
    if (await isEventProcessed(event.id)) {
      return { received: true, type: event.type, processed: false };
    }

    const handler = handlers[event.type];
    if (handler) {
      await handler(event.data.object, event);
    }

    // Mark as processed after successful handling
    await markEventProcessed(event.id, event.type);

    return { received: true, type: event.type, processed: true };
  };
}

export class WebhookError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'WebhookError';
  }
}
