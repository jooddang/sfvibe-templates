# Stripe Checkout Template

Stripe Checkout integration for one-time payments in Next.js applications. This template provides a complete solution for accepting payments using Stripe's hosted checkout page.

## Features

- Stripe Checkout session creation
- Webhook handling for payment events
- Client-side checkout button component
- TypeScript support with full type safety
- Next.js App Router compatible

## Installation

```bash
pnpm add stripe @stripe/stripe-js
```

## Configuration

### 1. Get Stripe API Keys

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** and **Secret key**

### 2. Set Environment Variables

Add the following to your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Webhook (Production)

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Local Webhook Testing

Use the Stripe CLI for local development:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## File Structure

Copy the files to your Next.js project:

```
src/
├── lib/
│   └── stripe.ts              # Stripe client configuration
├── app/
│   └── api/
│       ├── checkout/
│       │   └── route.ts       # Checkout session API
│       └── webhooks/
│           └── stripe/
│               └── route.ts   # Webhook handler
└── components/
    └── checkout-button.tsx    # Checkout button component
```

## Usage

### Basic Checkout Button

```tsx
import { CheckoutButton } from '@/components/checkout-button';

export default function ProductPage() {
  return (
    <div>
      <h1>Premium Plan</h1>
      <p>$29/month</p>
      <CheckoutButton priceId="price_1234567890">
        Subscribe Now
      </CheckoutButton>
    </div>
  );
}
```

### Programmatic Checkout

```typescript
const handlePurchase = async () => {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: 'price_1234567890',
      quantity: 1,
    }),
  });

  const { url } = await response.json();
  window.location.href = url;
};
```

### Creating Products and Prices

Create products in the Stripe Dashboard or via API:

```typescript
// Create a product
const product = await stripe.products.create({
  name: 'Premium Plan',
  description: 'Access to all features',
});

// Create a price
const price = await stripe.prices.create({
  product: product.id,
  unit_amount: 2900, // $29.00 in cents
  currency: 'usd',
});
```

## Webhook Events

The webhook handler processes these events:

| Event | Description |
|-------|-------------|
| `checkout.session.completed` | Payment was successful |
| `payment_intent.succeeded` | Payment intent completed |

### Handling Successful Payments

Customize the webhook handler for your business logic:

```typescript
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;

  // Get customer email
  const customerEmail = session.customer_details?.email;

  // Fulfill the order
  await fulfillOrder(session.id, customerEmail);

  // Send confirmation email
  await sendConfirmationEmail(customerEmail);

  break;
}
```

## Success and Cancel Pages

Create pages to handle post-checkout redirects:

```tsx
// src/app/checkout/success/page.tsx
export default function CheckoutSuccess({
  searchParams,
}: {
  searchParams: { session_id: string };
}) {
  return (
    <div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
    </div>
  );
}

// src/app/checkout/cancel/page.tsx
export default function CheckoutCancel() {
  return (
    <div>
      <h1>Payment Cancelled</h1>
      <p>Your payment was cancelled.</p>
    </div>
  );
}
```

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **Server-side Secrets**: Never expose `STRIPE_SECRET_KEY` to the client
3. **Idempotency**: Handle duplicate webhook events gracefully
4. **HTTPS**: Use HTTPS in production for all Stripe endpoints

## Testing

Use Stripe test mode and test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

## Related Templates

- [Stripe Subscription](../stripe-subscription) - For recurring payments

## Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
