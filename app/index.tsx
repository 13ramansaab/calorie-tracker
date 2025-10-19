import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    console.log('Splash screen - Auth state:', { loading, session: !!session, profile: !!profile });
    console.log('Profile data:', profile);
    
    if (!loading) {
      if (session && profile) {
        console.log('User authenticated with profile, checking onboarding status...');
        if (profile.date_of_birth && profile.goal_weight_kg) {
          console.log('Profile complete, redirecting to main app');
          router.replace('/(tabs)');
        } else {
          console.log('Profile incomplete, redirecting to onboarding');
          router.replace('/onboarding/step1');
        }
      } else {
        console.log('No session or profile, redirecting to welcome');
        router.replace('/welcome');
      }
    }
  }, [loading, session, profile]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <ActivityIndicator size="large" color="#10b981" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  loader: {
    marginTop: 20,
  },
});
