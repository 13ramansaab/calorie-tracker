import { UsageLimit } from '@/types/ai';

export const checkPremiumStatus = (subscriptionTier: string | null): boolean => {
  return subscriptionTier === 'premium' || subscriptionTier === 'lifetime';
};

export const showPremiumPrompt = (
  title: string = 'Premium Feature',
  message: string = 'Upgrade to Premium to unlock this feature and get access to advanced meal planning, insights, and more.'
) => {
  return {
    title,
    message,
    buttons: [
      { text: 'Maybe Later', style: 'cancel' as const },
      { text: 'Upgrade Now', onPress: () => {} },
    ],
  };
};

export function canUseFeature(
  feature: 'photo_analysis' | 'meal_planning' | 'data_export' | 'advanced_insights',
  subscriptionTier: string,
  usageLimit?: UsageLimit
): boolean {
  const isPremium = subscriptionTier === 'premium' || subscriptionTier === 'lifetime';

  if (isPremium) return true;

  if (feature === 'photo_analysis' && usageLimit) {
    return usageLimit.currentPhotoCount < usageLimit.photoAnalysesPerDay;
  }

  return false;
}

export function getFeatureGateMessage(
  feature: 'photo_analysis' | 'meal_planning' | 'data_export' | 'advanced_insights'
): string {
  const messages = {
    photo_analysis: 'Upgrade to Premium for unlimited AI photo analysis',
    meal_planning: 'AI Meal Planning is a Premium feature',
    data_export: 'Data Export is available with Premium',
    advanced_insights: 'Advanced Insights require Premium',
  };

  return messages[feature];
}
