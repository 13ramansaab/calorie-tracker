import { supabase } from '@/lib/supabase';

export interface QuotaStatus {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetsAt: Date;
  isPremium: boolean;
}

export interface QuotaConfig {
  free_daily_vision: number;
  free_daily_text: number;
  premium_daily_vision: number;
  premium_daily_text: number;
}

const DEFAULT_QUOTA: QuotaConfig = {
  free_daily_vision: 5,
  free_daily_text: 20,
  premium_daily_vision: 100,
  premium_daily_text: 500,
};

export async function enforceQuotaOrPaywall(
  userId: string,
  quotaType: 'vision_daily' | 'text_daily',
  isPremium: boolean = false
): Promise<QuotaStatus> {
  const today = new Date().toISOString().split('T')[0];

  const limit = isPremium
    ? (quotaType === 'vision_daily' ? DEFAULT_QUOTA.premium_daily_vision : DEFAULT_QUOTA.premium_daily_text)
    : (quotaType === 'vision_daily' ? DEFAULT_QUOTA.free_daily_vision : DEFAULT_QUOTA.free_daily_text);

  const { data: usage, error } = await supabase
    .from('analysis_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', quotaType === 'vision_daily' ? 'vision_analysis_requested' : 'text_analysis_requested')
    .gte('created_at', `${today}T00:00:00Z`)
    .lt('created_at', `${today}T23:59:59Z`);

  if (error) {
    console.error('Error checking quota:', error);
    return {
      allowed: true,
      remaining: limit,
      limit,
      resetsAt: getNextMidnight(),
      isPremium,
    };
  }

  const used = usage?.length || 0;
  const remaining = Math.max(0, limit - used);
  const allowed = used < limit;

  return {
    allowed,
    remaining,
    limit,
    resetsAt: getNextMidnight(),
    isPremium,
  };
}

export async function trackQuotaUsage(
  userId: string,
  quotaType: 'vision_daily' | 'text_daily'
): Promise<void> {
  await supabase.from('analysis_events').insert({
    user_id: userId,
    event_type: quotaType === 'vision_daily' ? 'vision_analysis_requested' : 'text_analysis_requested',
    event_data: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function getUserSubscriptionStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('status, expires_at')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

export async function getQuotaRemaining(
  userId: string,
  isPremium: boolean = false
): Promise<{ vision: number; text: number }> {
  const visionStatus = await enforceQuotaOrPaywall(userId, 'vision_daily', isPremium);
  const textStatus = await enforceQuotaOrPaywall(userId, 'text_daily', isPremium);

  return {
    vision: visionStatus.remaining,
    text: textStatus.remaining,
  };
}

function getNextMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export function getQuotaResetMessage(resetsAt: Date): string {
  const now = new Date();
  const diffMs = resetsAt.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `Resets in ${diffHours}h ${diffMinutes}m`;
  }
  return `Resets in ${diffMinutes}m`;
}
