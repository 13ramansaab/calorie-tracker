import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, CheckCircle, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SUBSCRIPTION_PLANS, FREE_TIER_LIMITS, TRIAL_DURATION_DAYS } from '@/types/subscription';
import { startFreeTrial } from '@/lib/subscriptionService';
import { useAuth } from '@/contexts/AuthContext';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  onStartTrial?: () => void;
  feature?: string;
  usageCount?: number;
  usageLimit?: number;
}

export function Paywall({
  visible,
  onClose,
  onStartTrial,
  feature = 'Premium Features',
  usageCount,
  usageLimit,
}: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState('premium-monthly');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const premiumPlans = SUBSCRIPTION_PLANS.filter((p) => p.tier === 'premium');

  const handleStartTrial = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to start your trial');
      return;
    }

    setLoading(true);
    try {
      await startFreeTrial(user.id);
      Alert.alert(
        'Trial Started!',
        `Your ${TRIAL_DURATION_DAYS}-day free trial has begun. Enjoy unlimited access to all premium features!`,
        [
          {
            text: 'Start Using',
            onPress: () => {
              onStartTrial?.();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error starting trial:', error);
      Alert.alert('Error', 'Failed to start trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    router.push('/subscription');
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={['#fbbf24', '#f59e0b']}
            style={styles.featureBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Sparkles size={32} color="#ffffff" />
            <Text style={styles.bannerTitle}>Unlock {feature}</Text>
            {usageCount !== undefined && usageLimit !== undefined && (
              <Text style={styles.bannerSubtitle}>
                You've used {usageCount} of {usageLimit} free uses today
              </Text>
            )}
          </LinearGradient>

          <View style={styles.comparisonSection}>
            <Text style={styles.comparisonTitle}>Premium Benefits</Text>
            <View style={styles.benefitsList}>
              {[
                'Unlimited AI photo analysis',
                'Personalized meal planning',
                'Recipe suggestions',
                'Advanced insights & reports',
                'Export data anytime',
                'Priority support',
              ].map((benefit, index) => (
                <View key={index} style={styles.benefitItem}>
                  <CheckCircle size={20} color="#10b981" />
                  <Text style={styles.benefitText}>{benefit}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.plansSection}>
            <Text style={styles.plansSectionTitle}>Choose Your Plan</Text>
            {premiumPlans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const savings =
                plan.interval === 'year'
                  ? Math.round(((9.99 * 12 - plan.price) / (9.99 * 12)) * 100)
                  : 0;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[styles.planCard, isSelected && styles.planCardSelected]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  )}
                  {savings > 0 && (
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>Save {savings}%</Text>
                    </View>
                  )}
                  <View style={styles.planCardContent}>
                    <View style={styles.planLeft}>
                      <View
                        style={[
                          styles.radioOuter,
                          isSelected && styles.radioOuterSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planPrice}>
                          ${plan.price}
                          <Text style={styles.planInterval}>
                            /{plan.interval === 'year' ? 'year' : 'month'}
                          </Text>
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.featuresComparison}>
            <Text style={styles.featuresTitle}>What's Included</Text>
            <View style={styles.featuresTable}>
              {[
                { feature: 'Photo Analysis', free: '3 per day', premium: 'Unlimited' },
                { feature: 'Meal Planning', free: '—', premium: '✓' },
                { feature: 'Recipe Database', free: 'Basic', premium: 'Full Access' },
                { feature: 'Data Export', free: '—', premium: '✓' },
                { feature: 'Insights Reports', free: 'Basic', premium: 'Advanced' },
              ].map((item, index) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureName}>{item.feature}</Text>
                  <Text style={styles.featureFree}>{item.free}</Text>
                  <Text style={styles.featurePremium}>{item.premium}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleStartTrial}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.subscribeGradient}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.subscribeButtonText}>
                    Start {TRIAL_DURATION_DAYS}-Day Free Trial
                  </Text>
                  <Text style={styles.subscribeSubtext}>No card required</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleSubscribe}
            disabled={loading}
          >
            <Text style={styles.upgradeButtonText}>Subscribe Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.maybeLaterButton} onPress={onClose}>
            <Text style={styles.maybeLaterText}>Maybe Later</Text>
          </TouchableOpacity>
          <Text style={styles.terms}>
            Cancel anytime. Terms apply.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  featureBanner: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
  },
  comparisonSection: {
    padding: 24,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#1f2937',
  },
  plansSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  plansSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  planCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#10b981',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fbbf24',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    zIndex: 1,
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  planCardContent: {
    padding: 16,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#10b981',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  planInterval: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
  },
  featuresComparison: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  featuresTable: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  featureName: {
    flex: 2,
    fontSize: 14,
    color: '#1f2937',
  },
  featureFree: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  featurePremium: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subscribeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  subscribeSubtext: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  upgradeButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  maybeLaterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  terms: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
});
