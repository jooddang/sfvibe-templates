export interface PricingPlan {
  name: string;
  description: string;
  priceId: string;
  priceIdYearly?: string;
  monthlyPrice: number;
  yearlyPrice?: number;
  features: string[];
  highlighted?: boolean;
  cta?: string;
}

export const plans: PricingPlan[] = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    priceId: '', // No checkout for free tier
    monthlyPrice: 0,
    features: ['Up to 3 projects', 'Basic analytics', 'Community support'],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    description: 'For growing teams',
    priceId: 'price_xxx_monthly', // Replace with your Stripe price ID
    priceIdYearly: 'price_xxx_yearly',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: ['Unlimited projects', 'Advanced analytics', 'Priority support', 'API access'],
    highlighted: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    description: 'For large organizations',
    priceId: 'price_xxx_enterprise',
    monthlyPrice: 99,
    features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
    cta: 'Contact Sales',
  },
];

export function getPlanByPriceId(priceId: string): PricingPlan | undefined {
  return plans.find((p) => p.priceId === priceId || p.priceIdYearly === priceId);
}
