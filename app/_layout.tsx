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

    console.log('Navigation guard:', {
      loading,
      hasSession: !!session,
      hasProfile: !!profile,
      segments,
      inAuthGroup,
      inOnboarding,
      inTabs,
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
      } else if (isProfileComplete && !inTabs && segments[0] !== 'index') {
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
