import { NextRequest, NextResponse } from 'next/server';
import { stripe, idempotencyKey } from '@/lib/stripe';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface SubscriptionRequest {
  priceId: string;
  trialDays?: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SubscriptionRequest = await request.json();
    const { priceId, trialDays } = body;

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Valid priceId is required' }, { status: 400 });
    }

    // Get or create Stripe customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeCustomerId: true, subscriptionStatus: true, email: true },
    });

    // Check for existing active subscription
    if (user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing') {
      return NextResponse.json({ error: 'Active subscription exists. Use portal to manage.' }, { status: 400 });
    }

    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create(
        { email: user?.email ?? undefined, metadata: { userId: session.user.id } },
        { idempotencyKey: idempotencyKey('customer') }
      );
      customerId = customer.id;

      await prisma.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
        subscription_data: {
          metadata: { userId: session.user.id },
          trial_period_days: trialDays,
        },
      },
      { idempotencyKey: idempotencyKey('subscription') }
    );

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Subscription error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
