import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, TrendingUp, Award, Lightbulb } from 'lucide-react-native';
import type { WeeklySummary } from '@/lib/weeklySummaryService';

interface WeeklySummaryCardProps {
  summary: WeeklySummary;
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const weekStart = new Date(summary.week_start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const weekEnd = new Date(summary.week_end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const complianceColor =
    summary.compliance_percentage >= 70
      ? '#10b981'
      : summary.compliance_percentage >= 50
        ? '#f59e0b'
        : '#ef4444';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Calendar size={24} color="#ffffff" />
          <Text style={styles.headerTitle}>Weekly Recap</Text>
        </View>
        <Text style={styles.dateRange}>
          {weekStart} - {weekEnd}
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {Math.round(summary.total_calories).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Calories</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statValue}>{Math.round(summary.avg_daily_calories)}</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
          </View>

          <View style={styles.statBox}>
            <View style={styles.complianceBadge}>
              <Text style={[styles.statValue, { color: complianceColor }]}>
                {summary.compliance_percentage}%
              </Text>
            </View>
            <Text style={styles.statLabel}>On Track</Text>
          </View>
        </View>

        {summary.top_dishes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={18} color="#10b981" />
              <Text style={styles.sectionTitle}>Top Dishes</Text>
            </View>
            <View style={styles.dishList}>
              {summary.top_dishes.map((dish, index) => (
                <View key={index} style={styles.dishItem}>
                  <View style={styles.dishRank}>
                    <Text style={styles.dishRankText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.dishName}>{dish.name}</Text>
                  <Text style={styles.dishCount}>{dish.count}×</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {summary.tip && (
          <View style={styles.tipBox}>
            <View style={styles.tipHeader}>
              <Lightbulb size={16} color="#f59e0b" />
              <Text style={styles.tipTitle}>Tip of the Week</Text>
            </View>
            <Text style={styles.tipText}>{summary.tip}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  dateRange: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  complianceBadge: {
    marginBottom: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  dishList: {
    gap: 8,
  },
  dishItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  dishRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  dishName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  dishCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  tipBox: {
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  tipText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
});
