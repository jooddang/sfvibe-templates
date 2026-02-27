import { NextRequest, NextResponse } from 'next/server';
import { stripe, idempotencyKey } from '@/lib/stripe';

interface CheckoutRequest {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { priceId, quantity = 1, customerEmail, metadata } = body;

    if (!priceId || typeof priceId !== 'string') {
      return NextResponse.json({ error: 'Valid priceId is required' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity }],
        customer_email: customerEmail,
        metadata: metadata ?? {},
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      },
      { idempotencyKey: idempotencyKey('checkout') }
    );

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
