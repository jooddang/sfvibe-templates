# Stripe Subscriptions Template

Stripe subscription billing with customer portal for Next.js applications. Handles recurring payments, plan changes, cancellations, and webhook events.

## Features

- Subscription checkout with Stripe Checkout
- Customer portal for self-service billing management
- Webhook handling for subscription lifecycle events
- Automatic customer creation and linking
- Support for plan upgrades/downgrades

## Installation

```bash
pnpm add stripe @stripe/stripe-js
```

## Environment Variables

Add these to your `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup

### 1. Stripe Dashboard Configuration

1. Create products and prices in [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Configure the [Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
3. Set up webhook endpoint pointing to `/api/webhooks/stripe`

### 2. Database Schema

Add these fields to your User model (Prisma example):

```prisma
model User {
  id                 String  @id @default(cuid())
  email              String  @unique
  stripeCustomerId   String? @unique
  subscriptionId     String?
  subscriptionStatus String?
  priceId            String?
  // ... other fields
}
```

### 3. File Structure

Copy the template files to your project:

```
src/
├── lib/
│   └── stripe.ts                          # Stripe client
└── app/
    └── api/
        ├── subscription/
        │   ├── create/
        │   │   └── route.ts               # Create subscription checkout
        │   └── portal/
        │       └── route.ts               # Customer portal link
        └── webhooks/
            └── stripe/
                └── route.ts               # Webhook handler
```

## Usage

### Create Subscription

```typescript
// Client-side: Redirect to checkout
async function subscribe(priceId: string) {
  const response = await fetch('/api/subscription/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priceId }),
  });

  const { url } = await response.json();
  window.location.href = url;
}
```

### Open Customer Portal

```typescript
// Client-side: Redirect to billing portal
async function openBillingPortal() {
  const response = await fetch('/api/subscription/portal', {
    method: 'POST',
  });

  const { url } = await response.json();
  window.location.href = url;
}
```

### Check Subscription Status

```typescript
// Server-side: Check if user has active subscription
async function hasActiveSubscription(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true },
  });

  return user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing';
}
```

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `customer.subscription.created` | Store subscription details |
| `customer.subscription.updated` | Update subscription status and price |
| `customer.subscription.deleted` | Mark subscription as canceled |

## Testing

### Local Webhook Testing

Use Stripe CLI to forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## Pricing Page Example

```tsx
const plans = [
  { name: 'Basic', priceId: 'price_basic_monthly', price: '$9/mo' },
  { name: 'Pro', priceId: 'price_pro_monthly', price: '$29/mo' },
  { name: 'Enterprise', priceId: 'price_enterprise_monthly', price: '$99/mo' },
];

function PricingPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {plans.map((plan) => (
        <div key={plan.priceId} className="border p-4 rounded">
          <h3>{plan.name}</h3>
          <p>{plan.price}</p>
          <button onClick={() => subscribe(plan.priceId)}>
            Subscribe
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Security Considerations

- Always verify webhook signatures
- Use HTTPS in production
- Store Stripe keys securely (never commit to git)
- Validate user authentication before creating sessions

## Related Templates

- [Stripe Checkout](../stripe-checkout) - One-time payments
