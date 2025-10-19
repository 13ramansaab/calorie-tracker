import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const FREE_FEATURES = [
  'Track up to 3 meals per day',
  'Basic nutrition insights',
  'Indian food database access',
];

const PREMIUM_FEATURES = [
  'Unlimited meal tracking',
  'AI photo analysis',
  'Advanced analytics & reports',
  'Premium recipe collection',
  'Priority support',
  'Weekly progress reports',
];

export default function SubscriptionIntro() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: 'trial',
        status: 'active',
        trial_start_date: new Date().toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndDate.toISOString(),
      });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error starting trial:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFree = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: 'free',
        status: 'active',
      });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error setting up free plan:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.sparkleIcon}>
            <Sparkles size={32} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>Unlock Full Potential</Text>
          <Text style={styles.headerSubtitle}>
            Start your 7-day free trial and experience all premium features
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Premium</Text>
            <View style={styles.trialBadge}>
              <Text style={styles.trialBadgeText}>7 days free</Text>
            </View>
          </View>

          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.checkIcon}>
                  <Check size={16} color="#10b981" />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.trialButton, loading && styles.buttonDisabled]}
            onPress={handleStartTrial}
            disabled={loading}
          >
            <Text style={styles.trialButtonText}>Start Free Trial</Text>
          </TouchableOpacity>

          <Text style={styles.trialNote}>
            No payment required. Cancel anytime during trial.
          </Text>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.freeCard}>
          <Text style={styles.freeTitle}>Continue with Free</Text>
          <View style={styles.featureList}>
            {FREE_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.checkIconGray}>
                  <Check size={16} color="#6b7280" />
                </View>
                <Text style={styles.featureTextGray}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.freeButton, loading && styles.buttonDisabled]}
            onPress={handleContinueFree}
            disabled={loading}
          >
            <Text style={styles.freeButtonText}>Continue Free</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  sparkleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -20,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  trialBadge: {
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  trialBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  featureList: {
    gap: 12,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconGray: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    color: '#1f2937',
    flex: 1,
  },
  featureTextGray: {
    fontSize: 15,
    color: '#6b7280',
    flex: 1,
  },
  trialButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trialButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  trialNote: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  freeCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  freeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  freeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  freeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
