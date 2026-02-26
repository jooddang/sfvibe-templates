import { plans, type PricingPlan } from '@/config/pricing-config';

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getCurrentPlan(priceId: string | null | undefined): PricingPlan {
  if (!priceId) return plans[0]; // Free tier
  const plan = plans.find((p) => p.priceId === priceId || p.priceIdYearly === priceId);
  return plan ?? plans[0];
}

export function isUpgrade(currentPriceId: string | null | undefined, newPriceId: string): boolean {
  const currentPlan = getCurrentPlan(currentPriceId);
  const newPlan = plans.find((p) => p.priceId === newPriceId || p.priceIdYearly === newPriceId);
  if (!newPlan) return false;
  return plans.indexOf(newPlan) > plans.indexOf(currentPlan);
}
