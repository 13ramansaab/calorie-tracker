import { supabase } from '@/lib/supabase';
import { TRIAL_DURATION_DAYS } from '@/types/subscription';

export interface Subscription {
  id: string;
  user_id: string;
  status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'unpaid';
  tier: 'free' | 'premium' | 'lifetime';
  trial_start: string | null;
  trial_end: string | null;
  period_start: string | null;
  period_end: string | null;
  payment_failed_at: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface FeatureAccess {
  canUse: boolean;
  reason?: string;
  remainingCount?: number;
  resetAt?: string;
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  if (!data) {
    const newSub = await createFreeSubscription(userId);
    return newSub;
  }

  return data;
}

async function createFreeSubscription(userId: string): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      tier: 'free',
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating free subscription:', error);
    throw error;
  }

  return data;
}

export async function startFreeTrial(userId: string): Promise<Subscription> {
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'premium',
      status: 'trialing',
      trial_start: trialStart.toISOString(),
      trial_end: trialEnd.toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error starting trial:', error);
    throw error;
  }

  await trackEvent(userId, 'trial_started', {
    trial_end: trialEnd.toISOString(),
  });

  return data;
}

export async function upgradeToPremium(
  userId: string,
  priceId: string,
  providerData: {
    subscription_id: string;
    customer_id: string;
  }
): Promise<Subscription> {
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'premium',
      status: 'active',
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      stripe_subscription_id: providerData.subscription_id,
      stripe_customer_id: providerData.customer_id,
      stripe_price_id: priceId,
      cancel_at_period_end: false,
      trial_start: null,
      trial_end: null,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error upgrading to premium:', error);
    throw error;
  }

  await trackEvent(userId, 'subscription_upgraded', {
    price_id: priceId,
  });

  return data;
}

export async function switchPlan(
  userId: string,
  newPriceId: string
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ stripe_price_id: newPriceId })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error switching plan:', error);
    throw error;
  }

  await trackEvent(userId, 'plan_switched', { new_price_id: newPriceId });

  return data;
}

export async function cancelSubscription(
  userId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      cancel_at_period_end: cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? 'active' : 'canceled',
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

  await trackEvent(userId, 'subscription_canceled', {
    cancel_at_period_end: cancelAtPeriodEnd,
  });

  return data;
}

export function isPremiumUser(subscription: Subscription | null): boolean {
  if (!subscription) return false;

  if (subscription.tier === 'lifetime') return true;

  if (subscription.status === 'trialing') {
    if (!subscription.trial_end) return false;
    return new Date(subscription.trial_end) > new Date();
  }

  if (subscription.status === 'active' && subscription.tier === 'premium') {
    return true;
  }

  return false;
}

export function isInTrial(subscription: Subscription | null): boolean {
  if (!subscription || subscription.status !== 'trialing') return false;
  if (!subscription.trial_end) return false;
  return new Date(subscription.trial_end) > new Date();
}

export function getTrialDaysRemaining(subscription: Subscription | null): number {
  if (!isInTrial(subscription)) return 0;
  if (!subscription?.trial_end) return 0;

  const trialEnd = new Date(subscription.trial_end);
  const now = new Date();
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export async function canUseFeature(
  userId: string,
  feature: 'photo_analysis' | 'ai_chat' | 'meal_planning' | 'data_export' | 'advanced_insights'
): Promise<FeatureAccess> {
  const subscription = await getUserSubscription(userId);

  if (isPremiumUser(subscription)) {
    return { canUse: true };
  }

  if (feature === 'photo_analysis') {
    return await checkPhotoAnalysisLimit(userId);
  }

  if (feature === 'ai_chat') {
    return await checkAIChatLimit(userId);
  }

  return {
    canUse: false,
    reason: `${feature.replace('_', ' ')} is a premium feature`,
  };
}

async function checkPhotoAnalysisLimit(userId: string): Promise<FeatureAccess> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('photo_analyses')
    .eq('user_id', userId)
    .eq('date', today.toISOString().split('T')[0])
    .maybeSingle();

  if (error) {
    console.error('Error checking photo limit:', error);
    return { canUse: false, reason: 'Error checking usage' };
  }

  const currentCount = data?.photo_analyses || 0;
  const limit = 1;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (currentCount >= limit) {
    return {
      canUse: false,
      reason: 'Daily photo analysis limit reached',
      remainingCount: 0,
      resetAt: tomorrow.toISOString(),
    };
  }

  return {
    canUse: true,
    remainingCount: limit - currentCount,
    resetAt: tomorrow.toISOString(),
  };
}

async function checkAIChatLimit(userId: string): Promise<FeatureAccess> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_tracking')
    .select('ai_chat_messages')
    .eq('user_id', userId)
    .eq('date', today.toISOString().split('T')[0])
    .maybeSingle();

  if (error) {
    console.error('Error checking chat limit:', error);
    return { canUse: false, reason: 'Error checking usage' };
  }

  const currentCount = data?.ai_chat_messages || 0;
  const limit = 5;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (currentCount >= limit) {
    return {
      canUse: false,
      reason: 'Daily AI chat limit reached',
      remainingCount: 0,
      resetAt: tomorrow.toISOString(),
    };
  }

  return {
    canUse: true,
    remainingCount: limit - currentCount,
    resetAt: tomorrow.toISOString(),
  };
}

export async function incrementUsage(
  userId: string,
  type: 'photo_analysis' | 'ai_chat'
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = today.toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('date', dateStr)
    .maybeSingle();

  if (existing) {
    const updates =
      type === 'photo_analysis'
        ? { photo_analyses: existing.photo_analyses + 1 }
        : { ai_chat_messages: existing.ai_chat_messages + 1 };

    await supabase.from('usage_tracking').update(updates).eq('id', existing.id);
  } else {
    await supabase.from('usage_tracking').insert({
      user_id: userId,
      date: dateStr,
      photo_analyses: type === 'photo_analysis' ? 1 : 0,
      ai_chat_messages: type === 'ai_chat' ? 1 : 0,
      text_analyses: 0,
    });
  }
}

export async function handlePaymentFailed(userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      payment_failed_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating payment failed status:', error);
    throw error;
  }

  await trackEvent(userId, 'payment_failed', {
    timestamp: new Date().toISOString(),
  });
}

export async function handlePaymentSucceeded(userId: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      payment_failed_at: null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating payment succeeded status:', error);
    throw error;
  }

  await trackEvent(userId, 'payment_succeeded', {
    timestamp: new Date().toISOString(),
  });
}

export async function updateSubscriptionPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<void> {
  const { error } = await supabase
    .from('subscriptions')
    .update({
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription period:', error);
    throw error;
  }
}

export function getDaysUntilRenewal(subscription: Subscription | null): number {
  if (!subscription?.period_end) return 0;

  const periodEnd = new Date(subscription.period_end);
  const now = new Date();
  const diffTime = periodEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function getSubscriptionStatusMessage(subscription: Subscription | null): string {
  if (!subscription) return 'No active subscription';

  if (subscription.status === 'trialing') {
    const daysLeft = getTrialDaysRemaining(subscription);
    return `Trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  }

  if (subscription.status === 'past_due') {
    return 'Payment failed. Please update your payment method.';
  }

  if (subscription.cancel_at_period_end) {
    const daysLeft = getDaysUntilRenewal(subscription);
    return `Subscription ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
  }

  if (subscription.status === 'active' && subscription.tier === 'premium') {
    return 'Premium subscription active';
  }

  return 'Free plan';
}

async function trackEvent(
  userId: string,
  eventName: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await supabase.from('event_tracking').insert({
      user_id: userId,
      event_name: eventName,
      event_data: metadata || {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}
