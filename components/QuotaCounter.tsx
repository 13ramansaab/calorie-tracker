import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Camera, Clock, AlertCircle, Sparkles } from 'lucide-react-native';
import { ProgressBar } from './ProgressBar';

interface QuotaCounterProps {
  limit: number;
  used: number;
  resetDate: string;
  type?: 'photo' | 'text' | 'feature';
  showUpgrade?: boolean;
  onUpgrade?: () => void;
  variant?: 'banner' | 'card' | 'inline';
}

export function QuotaCounter({
  limit,
  used,
  resetDate,
  type = 'photo',
  showUpgrade = true,
  onUpgrade,
  variant = 'card',
}: QuotaCounterProps) {
  const remaining = Math.max(0, limit - used);
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const isLimitReached = remaining === 0;
  const isNearLimit = remaining <= 1 && remaining > 0;

  const resetTime = new Date(resetDate);
  const now = new Date();
  const hoursUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / (1000 * 60 * 60));

  const icon = type === 'photo' ? Camera : Sparkles;
  const Icon = icon;

  const typeLabel = type === 'photo' ? 'Photo Analyses' : 'AI Analyses';

  if (variant === 'banner') {
    return (
      <View
        style={[
          styles.banner,
          isLimitReached && styles.bannerError,
          isNearLimit && styles.bannerWarning,
        ]}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerIcon}>
            {isLimitReached ? (
              <AlertCircle size={20} color="#ef4444" />
            ) : (
              <Icon size={20} color="#6b7280" />
            )}
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>
              {isLimitReached
                ? `${typeLabel} Limit Reached`
                : `${remaining} ${typeLabel} Remaining`}
            </Text>
            <Text style={styles.bannerSubtitle}>
              Resets in {hoursUntilReset}h
            </Text>
          </View>
        </View>
        {showUpgrade && onUpgrade && (
          <TouchableOpacity style={styles.bannerButton} onPress={onUpgrade}>
            <Text style={styles.bannerButtonText}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <View style={styles.inlineLeft}>
          <Icon size={16} color="#6b7280" />
          <Text style={styles.inlineText}>
            {remaining} / {limit} remaining
          </Text>
        </View>
        {showUpgrade && onUpgrade && (
          <TouchableOpacity onPress={onUpgrade}>
            <Text style={styles.inlineUpgrade}>Upgrade</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View
            style={[
              styles.iconContainer,
              isLimitReached && styles.iconContainerError,
            ]}
          >
            <Icon size={20} color={isLimitReached ? '#ef4444' : '#10b981'} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{typeLabel}</Text>
            <Text style={styles.cardSubtitle}>Free Tier Limit</Text>
          </View>
        </View>
        <View style={styles.quota}>
          <Text style={styles.quotaUsed}>{used}</Text>
          <Text style={styles.quotaDivider}>/</Text>
          <Text style={styles.quotaLimit}>{limit}</Text>
        </View>
      </View>

      <ProgressBar
        current={used}
        max={limit}
        color={isLimitReached ? '#ef4444' : isNearLimit ? '#f59e0b' : '#10b981'}
        height={8}
      />

      <View style={styles.cardFooter}>
        <View style={styles.resetInfo}>
          <Clock size={14} color="#6b7280" />
          <Text style={styles.resetText}>
            Resets in {hoursUntilReset} {hoursUntilReset === 1 ? 'hour' : 'hours'}
          </Text>
        </View>
        {showUpgrade && onUpgrade && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Sparkles size={14} color="#ffffff" />
            <Text style={styles.upgradeButtonText}>Upgrade for Unlimited</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLimitReached && (
        <View style={styles.limitMessage}>
          <AlertCircle size={16} color="#ef4444" />
          <Text style={styles.limitMessageText}>
            Daily limit reached. Upgrade to Premium for unlimited access.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bannerWarning: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  bannerError: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  bannerButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#10b981',
    borderRadius: 6,
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  inlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineText: {
    fontSize: 13,
    color: '#6b7280',
  },
  inlineUpgrade: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerError: {
    backgroundColor: '#fee2e2',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  quota: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  quotaUsed: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  quotaDivider: {
    fontSize: 16,
    color: '#d1d5db',
  },
  quotaLimit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetText: {
    fontSize: 12,
    color: '#6b7280',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  limitMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  limitMessageText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 16,
  },
});
