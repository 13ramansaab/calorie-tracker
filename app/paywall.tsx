import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Paywall } from '@/components/Paywall';

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const feature = params.feature as string | undefined;
  const usageCount = params.usageCount ? parseInt(params.usageCount as string) : undefined;
  const usageLimit = params.usageLimit ? parseInt(params.usageLimit as string) : undefined;

  return (
    <Paywall
      visible={true}
      onClose={() => router.back()}
      feature={feature}
      usageCount={usageCount}
      usageLimit={usageLimit}
    />
  );
}
