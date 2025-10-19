import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export interface FeatureGateResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  isPremium: boolean;
  isLoading: boolean;
}

export type FeatureType = 'vision_daily' | 'chat_daily';

export function useFeatureGate(feature: FeatureType) {
  const { user } = useAuth();
  const [result, setResult] = useState<FeatureGateResult>({
    allowed: false,
    currentUsage: 0,
    limit: 0,
    isPremium: false,
    isLoading: true,
  });

  const checkUsage = useCallback(async () => {
    if (!user) {
      setResult({
        allowed: false,
        currentUsage: 0,
        limit: 0,
        isPremium: false,
        isLoading: false,
      });
      return;
    }

    try {
      await resetIfNeeded(user.id);

      const { data, error } = await supabase.rpc('can_use_feature', {
        p_user_id: user.id,
        p_feature: feature,
      });

      if (error) {
        console.error('Error checking feature usage:', error);
        setResult({
          allowed: false,
          currentUsage: 0,
          limit: 0,
          isPremium: false,
          isLoading: false,
        });
        return;
      }

      if (data && data.length > 0) {
        const row = data[0];
        setResult({
          allowed: row.allowed,
          currentUsage: row.current_usage,
          limit: row.limit_value,
          isPremium: row.is_premium,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error in checkUsage:', error);
      setResult({
        allowed: false,
        currentUsage: 0,
        limit: 0,
        isPremium: false,
        isLoading: false,
      });
    }
  }, [user, feature]);

  useEffect(() => {
    checkUsage();
  }, [checkUsage]);

  const canUse = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    await checkUsage();

    if (!result.allowed && !result.isLoading) {
      router.push('/paywall');
      return false;
    }

    return result.allowed;
  }, [user, result, checkUsage]);

  const incrementUsage = useCallback(async () => {
    if (!user) return;

    try {
      await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_feature: feature,
      });

      await checkUsage();
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }, [user, feature, checkUsage]);

  return {
    ...result,
    canUse,
    incrementUsage,
    refresh: checkUsage,
  };
}

async function resetIfNeeded(userId: string): Promise<void> {
  try {
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('last_reset_at, date')
      .eq('user_id', userId)
      .eq('date', new Date().toISOString().split('T')[0])
      .maybeSingle();

    if (!usage) {
      await supabase.rpc('reset_daily_usage', { p_user_id: userId });
      return;
    }

    const lastReset = new Date(usage.last_reset_at);
    const now = new Date();

    const lastResetMidnight = new Date(lastReset);
    lastResetMidnight.setHours(0, 0, 0, 0);

    const currentMidnight = new Date(now);
    currentMidnight.setHours(0, 0, 0, 0);

    if (currentMidnight > lastResetMidnight) {
      await supabase.rpc('reset_daily_usage', { p_user_id: userId });
    }
  } catch (error) {
    console.error('Error checking reset:', error);
  }
}

export function useQuotaCounter(feature: FeatureType) {
  const gate = useFeatureGate(feature);

  return {
    current: gate.currentUsage,
    limit: gate.limit,
    remaining: Math.max(0, gate.limit - gate.currentUsage),
    percentage: gate.limit > 0 ? (gate.currentUsage / gate.limit) * 100 : 0,
    isPremium: gate.isPremium,
    isLoading: gate.isLoading,
  };
}
