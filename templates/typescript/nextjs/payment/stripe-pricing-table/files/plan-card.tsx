'use client';

import { useState } from 'react';
import type { PricingPlan } from '@/config/pricing-config';

interface PlanCardProps {
  plan: PricingPlan;
  billingInterval: 'monthly' | 'yearly';
}

export function PlanCard({ plan, billingInterval }: PlanCardProps) {
  const [loading, setLoading] = useState(false);

  const price = billingInterval === 'yearly' && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice;
  const priceId = billingInterval === 'yearly' && plan.priceIdYearly ? plan.priceIdYearly : plan.priceId;

  const handleSubscribe = async () => {
    if (!priceId) return; // Free tier
    setLoading(true);
    try {
      const res = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg border ${plan.highlighted ? 'border-indigo-600 ring-2 ring-indigo-600' : 'border-gray-200'}`}>
      {plan.highlighted && <span className="text-xs text-indigo-600 font-semibold mb-2 block">Most Popular</span>}
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-gray-500">/{billingInterval === 'yearly' ? 'year' : 'month'}</span>
      </div>
      <ul className="space-y-2 mb-6">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center text-sm">
            <span className="mr-2 text-green-500">✓</span> {feature}
          </li>
        ))}
      </ul>
      <button
        onClick={handleSubscribe}
        disabled={loading || !priceId}
        className={`w-full py-2 rounded-lg font-medium ${
          plan.highlighted ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 hover:bg-gray-200'
        } disabled:opacity-50`}
      >
        {loading ? 'Loading...' : plan.cta || 'Subscribe'}
      </button>
    </div>
  );
}
