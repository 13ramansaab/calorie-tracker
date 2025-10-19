export type SubscriptionTier = 'free' | 'premium' | 'lifetime';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  interval: 'month' | 'year' | 'lifetime';
  features: string[];
  popular?: boolean;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    interval: 'month',
    features: [
      'Manual meal logging',
      'Basic nutrition tracking',
      'Daily calorie goals',
      'Food search',
      '3 photo analyses per day',
    ],
  },
  {
    id: 'premium-monthly',
    name: 'Premium',
    tier: 'premium',
    price: 9.99,
    interval: 'month',
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited photo analyses',
      'AI meal planning',
      'Recipe suggestions',
      'Detailed insights & reports',
      'Export data (PDF/CSV)',
      'Advanced progress charts',
      'Priority support',
    ],
  },
  {
    id: 'premium-yearly',
    name: 'Premium Annual',
    tier: 'premium',
    price: 79.99,
    interval: 'year',
    features: [
      'Everything in Premium',
      'Save 33% vs monthly',
      '2 months free',
    ],
  },
];

export const FREE_TIER_LIMITS = {
  photoAnalysesPerDay: 3,
  mealPlans: 0,
  dataExports: 0,
  advancedInsights: false,
};
