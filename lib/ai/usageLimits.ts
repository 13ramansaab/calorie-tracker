import { supabase } from '@/lib/supabase';
import { FREE_TIER_LIMITS } from '@/types/subscription';
import { UsageLimit } from '@/types/ai';

export async function checkUsageLimit(
  userId: string,
  type: 'photo' | 'text',
  subscriptionTier: string
): Promise<{ allowed: boolean; limit: UsageLimit; remaining: number }> {
  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'lifetime';

  if (isPremium) {
    return {
      allowed: true,
      limit: {
        photoAnalysesPerDay: -1,
        textAnalysesPerDay: -1,
        currentPhotoCount: 0,
        currentTextCount: 0,
        resetAt: new Date().toISOString(),
      },
      remaining: -1,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: usageData, error } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('date', today.toISOString())
    .maybeSingle();

  if (error) {
    console.error('Error checking usage:', error);
    return {
      allowed: false,
      limit: createDefaultLimit(),
      remaining: 0,
    };
  }

  const currentCount = usageData
    ? type === 'photo'
      ? usageData.photo_analyses
      : usageData.text_analyses
    : 0;

  const limit =
    type === 'photo'
      ? FREE_TIER_LIMITS.photoAnalysesPerDay
      : 10;

  const allowed = currentCount < limit;
  const remaining = Math.max(0, limit - currentCount);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    allowed,
    limit: {
      photoAnalysesPerDay: FREE_TIER_LIMITS.photoAnalysesPerDay,
      textAnalysesPerDay: 10,
      currentPhotoCount: type === 'photo' ? currentCount : usageData?.photo_analyses || 0,
      currentTextCount: type === 'text' ? currentCount : usageData?.text_analyses || 0,
      resetAt: tomorrow.toISOString(),
    },
    remaining,
  };
}

export async function incrementUsage(
  userId: string,
  type: 'photo' | 'text'
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today.toISOString())
    .maybeSingle();

  if (existing) {
    const updates =
      type === 'photo'
        ? { photo_analyses: existing.photo_analyses + 1 }
        : { text_analyses: existing.text_analyses + 1 };

    await supabase
      .from('usage_tracking')
      .update(updates)
      .eq('id', existing.id);
  } else {
    await supabase.from('usage_tracking').insert({
      user_id: userId,
      date: today.toISOString(),
      photo_analyses: type === 'photo' ? 1 : 0,
      text_analyses: type === 'text' ? 1 : 0,
    });
  }
}

export async function getUsageSummary(
  userId: string
): Promise<{
  today: { photo: number; text: number };
  week: { photo: number; text: number };
  month: { photo: number; text: number };
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const { data: todayData } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today.toISOString())
    .maybeSingle();

  const { data: weekData } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString());

  const { data: monthData } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .gte('date', monthAgo.toISOString());

  const sumUsage = (data: any[] | null) => {
    if (!data) return { photo: 0, text: 0 };
    return data.reduce(
      (acc, item) => ({
        photo: acc.photo + (item.photo_analyses || 0),
        text: acc.text + (item.text_analyses || 0),
      }),
      { photo: 0, text: 0 }
    );
  };

  return {
    today: {
      photo: todayData?.photo_analyses || 0,
      text: todayData?.text_analyses || 0,
    },
    week: sumUsage(weekData),
    month: sumUsage(monthData),
  };
}

function createDefaultLimit(): UsageLimit {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  return {
    photoAnalysesPerDay: FREE_TIER_LIMITS.photoAnalysesPerDay,
    textAnalysesPerDay: 10,
    currentPhotoCount: 0,
    currentTextCount: 0,
    resetAt: tomorrow.toISOString(),
  };
}

export function shouldShowPaywall(
  usageCheck: { allowed: boolean; remaining: number },
  subscriptionTier: string
): boolean {
  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'lifetime';
  return !isPremium && !usageCheck.allowed;
}

export function getPaywallMessage(
  type: 'photo' | 'text',
  limit: UsageLimit
): string {
  if (type === 'photo') {
    return `You've used all ${limit.photoAnalysesPerDay} photo analyses for today. Upgrade to Premium for unlimited AI photo analysis!`;
  }
  return `You've reached your daily limit. Upgrade to Premium for unlimited AI meal analysis!`;
}
