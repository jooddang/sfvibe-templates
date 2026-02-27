import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const event = await prisma.stripeEvent.findUnique({ where: { id: eventId } });
  return event !== null;
}

export async function markEventProcessed(eventId: string, type: string): Promise<void> {
  await prisma.stripeEvent.create({
    data: { id: eventId, type },
  });
}

export async function upsertSubscription(subscription: Stripe.Subscription): Promise<void> {
  const data = {
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    stripeCustomerId: subscription.customer as string,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };

  const userId = subscription.metadata.userId;
  if (!userId) return;

  await prisma.subscription.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  await prisma.subscription.deleteMany({
    where: { stripeSubscriptionId: subscriptionId },
  });
}

export async function getUserByStripeCustomerId(customerId: string) {
  return prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
}
