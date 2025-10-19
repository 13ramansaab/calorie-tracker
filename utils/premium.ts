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
