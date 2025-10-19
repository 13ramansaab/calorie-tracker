import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { AlertCircle, Clock, XCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserSubscription,
  getSubscriptionStatusMessage,
  Subscription,
  isInTrial,
  isPremiumUser,
} from '@/lib/subscriptionService';
import { router } from 'expo-router';

export function SubscriptionBanner() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerType, setBannerType] = useState<'trial' | 'payment_failed' | 'canceled'>('trial');

  useEffect(() => {
    if (!user) return;

    loadSubscription();

    const interval = setInterval(loadSubscription, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const loadSubscription = async () => {
    if (!user) return;

    const sub = await getUserSubscription(user.id);
    setSubscription(sub);

    if (!sub) {
      setShowBanner(false);
      return;
    }

    if (sub.status === 'past_due') {
      setBannerType('payment_failed');
      setShowBanner(true);
    } else if (sub.cancel_at_period_end) {
      setBannerType('canceled');
      setShowBanner(true);
    } else if (isInTrial(sub) && isPremiumUser(sub)) {
      setBannerType('trial');
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  };

  if (!showBanner || !subscription) return null;

  const getMessage = () => {
    return getSubscriptionStatusMessage(subscription);
  };

  const getIcon = () => {
    switch (bannerType) {
      case 'payment_failed':
        return <XCircle size={20} color="#fff" />;
      case 'canceled':
        return <AlertCircle size={20} color="#fff" />;
      case 'trial':
        return <Clock size={20} color="#fff" />;
      default:
        return <AlertCircle size={20} color="#fff" />;
    }
  };

  const getBackgroundColor = () => {
    switch (bannerType) {
      case 'payment_failed':
        return '#dc2626';
      case 'canceled':
        return '#f59e0b';
      case 'trial':
        return '#3b82f6';
      default:
        return '#3b82f6';
    }
  };

  const handlePress = () => {
    if (bannerType === 'payment_failed' || bannerType === 'canceled') {
      router.push('/subscription');
    } else if (bannerType === 'trial') {
      router.push('/paywall');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: getBackgroundColor() }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>{getIcon()}</View>
        <Text style={styles.message}>{getMessage()}</Text>
        <Text style={styles.action}>Tap to manage</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  action: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    opacity: 0.9,
  },
});
