'use client';

import { useState } from 'react';
import { plans } from '@/config/pricing-config';
import { PlanCard } from '@/components/plan-card';

export function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Simple, transparent pricing</h2>
        <p className="text-gray-600 mb-8">Choose the plan that works for you</p>

        <div className="inline-flex rounded-lg border p-1">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm ${
              billingInterval === 'monthly' ? 'bg-indigo-600 text-white' : 'text-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-4 py-2 rounded-md text-sm ${
              billingInterval === 'yearly' ? 'bg-indigo-600 text-white' : 'text-gray-600'
            }`}
          >
            Yearly <span className="text-xs">(Save 20%)</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} billingInterval={billingInterval} />
        ))}
      </div>
    </div>
  );
}
