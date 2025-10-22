import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const { session, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    const inSettings = segments[0] === 'settings';
    const inAllowedScreens = ['subscription', 'paywall', 'support', 'privacy', 'terms', 'achievements', 'gallery', 'insights', 'chat', 'planner', 'meal', 'photo', 'recipe'].includes(segments[0]);

    console.log('Navigation guard:', {
      loading,
      hasSession: !!session,
      hasProfile: !!profile,
      segments,
      inAuthGroup,
      inOnboarding,
      inTabs,
      inSettings,
      inAllowedScreens,
    });

    if (!session) {
      if (!inAuthGroup && segments[0] !== 'index') {
        console.log('No session, redirecting to welcome');
        router.replace('/welcome');
      }
    } else if (session && profile) {
      const isProfileComplete = profile.date_of_birth && profile.goal_weight_kg;

      if (!isProfileComplete && !inOnboarding && segments[0] !== 'index') {
        console.log('Profile incomplete, redirecting to onboarding');
        router.replace('/onboarding/step1');
      } else if (isProfileComplete && !inTabs && !inSettings && !inAllowedScreens && segments[0] !== 'index') {
        console.log('Profile complete, redirecting to tabs');
        router.replace('/(tabs)');
      }
    }
  }, [session, profile, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings/personal-info" />
      <Stack.Screen name="settings/nutrition-goals" />
      <Stack.Screen name="settings/dietary-preferences" />
      <Stack.Screen name="settings/notifications" />
      <Stack.Screen name="settings/units" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="support" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="insights" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="planner" />
      <Stack.Screen name="meal" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="recipe" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
