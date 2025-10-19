import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  CreditCard,
  Download,
  CheckCircle,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { SUBSCRIPTION_PLANS, Payment } from '@/types/subscription';

export default function SubscriptionBilling() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSubscription(subData);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (paymentsData) {
        setPayments(paymentsData);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'Subscription management will open Stripe billing portal.',
      [{ text: 'OK' }]
    );
  };

  const handleUpdatePayment = () => {
    Alert.alert(
      'Update Payment Method',
      'Payment method update will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('Coming Soon', 'Cancellation will be available soon');
          },
        },
      ]
    );
  };

  const currentPlan = SUBSCRIPTION_PLANS.find(
    (p) => p.tier === (profile?.subscription_tier || 'free')
  );

  const isPremium = profile?.subscription_tier === 'premium' || profile?.subscription_tier === 'lifetime';
  const isTrialing = subscription?.status === 'trialing';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription & Billing</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.currentPlanCard}>
          <LinearGradient
            colors={isPremium ? ['#10b981', '#059669'] : ['#6b7280', '#4b5563']}
            style={styles.planGradient}
          >
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{currentPlan?.name || 'Free'}</Text>
              {isPremium && (
                <View style={styles.activeBadge}>
                  <CheckCircle size={16} color="#ffffff" />
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </View>

            {isPremium ? (
              <>
                <Text style={styles.planPrice}>
                  ${currentPlan?.price}
                  <Text style={styles.planInterval}>
                    /{currentPlan?.interval === 'year' ? 'year' : 'month'}
                  </Text>
                </Text>

                {isTrialing && subscription?.trial_ends_at && (
                  <View style={styles.trialBanner}>
                    <AlertCircle size={16} color="#ffffff" />
                    <Text style={styles.trialText}>
                      Trial ends{' '}
                      {new Date(subscription.trial_ends_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {subscription?.current_period_end && !isTrialing && (
                  <View style={styles.renewalInfo}>
                    <Calendar size={14} color="#ffffff" />
                    <Text style={styles.renewalText}>
                      Renews on{' '}
                      {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text style={styles.freePlanText}>
                Upgrade to unlock premium features
              </Text>
            )}
          </LinearGradient>

          {isPremium && (
            <View style={styles.planActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleManageSubscription}
              >
                <Text style={styles.actionButtonText}>Manage Subscription</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isPremium && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        {isPremium && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentCard}>
                <View style={styles.paymentIcon}>
                  <CreditCard size={24} color="#6b7280" />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentType}>Visa ending in 4242</Text>
                  <Text style={styles.paymentExpiry}>Expires 12/2025</Text>
                </View>
                <TouchableOpacity
                  style={styles.updateButton}
                  onPress={handleUpdatePayment}
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Billing History</Text>
                <TouchableOpacity>
                  <Text style={styles.downloadAllText}>Download All</Text>
                </TouchableOpacity>
              </View>

              {payments.length > 0 ? (
                <View style={styles.invoicesList}>
                  {payments.map((payment) => (
                    <View key={payment.id} style={styles.invoiceItem}>
                      <View style={styles.invoiceLeft}>
                        <Text style={styles.invoiceDate}>
                          {new Date(payment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                        <Text style={styles.invoiceDescription}>
                          {payment.description}
                        </Text>
                      </View>
                      <View style={styles.invoiceRight}>
                        <Text style={styles.invoiceAmount}>
                          ${payment.amount.toFixed(2)}
                        </Text>
                        <TouchableOpacity style={styles.downloadButton}>
                          <Download size={16} color="#10b981" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No billing history yet</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need Help?</Text>
          <Text style={styles.helpText}>
            Contact our support team at support@nutritionapp.com for any billing
            questions or issues.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  currentPlanCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planGradient: {
    padding: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  planPrice: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
  },
  planInterval: {
    fontSize: 18,
    fontWeight: '400',
  },
  freePlanText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 8,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  renewalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  renewalText: {
    fontSize: 13,
    color: '#ffffff',
    opacity: 0.9,
  },
  planActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  upgradeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  downloadAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentExpiry: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  updateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  invoicesList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  invoiceLeft: {
    flex: 1,
  },
  invoiceDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  invoiceDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  invoiceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  downloadButton: {
    padding: 4,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  helpSection: {
    backgroundColor: '#eff6ff',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
