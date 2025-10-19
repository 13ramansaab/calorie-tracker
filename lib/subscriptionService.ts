import { supabase } from '@/lib/supabase';
import { TRIAL_DURATION_DAYS } from '@/types/subscription';

export interface Subscription {
  id: string;
  user_id: string;
  plan: 'free' | 'trial' | 'premium_monthly' | 'premium_yearly';
  status: 'active' | 'canceled' | 'expired' | 'past_due';
  trial_start_date: string | null;
  trial_end_date: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  provider: string | null;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
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
      plan: 'free',
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
      plan: 'trial',
      status: 'active',
      trial_start_date: trialStart.toISOString(),
      trial_end_date: trialEnd.toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error starting trial:', error);
    throw error;
  }

  await trackEvent(userId, 'trial_started', {
    trial_end_date: trialEnd.toISOString(),
  });

  return data;
}

export async function upgradeToPremium(
  userId: string,
  plan: 'premium_monthly' | 'premium_yearly',
  providerData: {
    provider: string;
    subscription_id: string;
    customer_id: string;
  }
): Promise<Subscription> {
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (plan === 'premium_monthly' ? 1 : 12));

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      plan,
      status: 'active',
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      provider: providerData.provider,
      provider_subscription_id: providerData.subscription_id,
      provider_customer_id: providerData.customer_id,
      cancel_at_period_end: false,
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error upgrading to premium:', error);
    throw error;
  }

  await trackEvent(userId, 'subscription_upgraded', {
    plan,
    provider: providerData.provider,
  });

  return data;
}

export async function switchPlan(
  userId: string,
  newPlan: 'premium_monthly' | 'premium_yearly'
): Promise<Subscription> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ plan: newPlan })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error switching plan:', error);
    throw error;
  }

  await trackEvent(userId, 'plan_switched', { new_plan: newPlan });

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

  if (subscription.status !== 'active') return false;

  if (subscription.plan === 'trial') {
    if (!subscription.trial_end_date) return false;
    return new Date(subscription.trial_end_date) > new Date();
  }

  return subscription.plan === 'premium_monthly' || subscription.plan === 'premium_yearly';
}

export function isInTrial(subscription: Subscription | null): boolean {
  if (!subscription || subscription.plan !== 'trial') return false;
  if (!subscription.trial_end_date) return false;
  return new Date(subscription.trial_end_date) > new Date();
}

export function getTrialDaysRemaining(subscription: Subscription | null): number {
  if (!isInTrial(subscription)) return 0;
  if (!subscription?.trial_end_date) return 0;

  const trialEnd = new Date(subscription.trial_end_date);
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

async function trackEvent(
  userId: string,
  eventName: string,
  metadata?: Record<string, any>
): Promise<void> {
  console.log('Event:', eventName, 'User:', userId, 'Metadata:', metadata);
}
