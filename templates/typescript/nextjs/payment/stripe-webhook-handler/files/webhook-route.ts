import { NextRequest, NextResponse } from 'next/server';
import { createWebhookHandler, WebhookError } from '@/lib/webhook-handler';
import { defaultHandlers } from '@/lib/webhook-events';

const handleWebhook = createWebhookHandler(defaultHandlers);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  try {
    const result = await handleWebhook(body, signature);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WebhookError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
