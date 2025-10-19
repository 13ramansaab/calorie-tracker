import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface StatTileProps {
  label: string;
  value: string | number;
  delta?: number;
  suffix?: string;
}

export function StatTile({ label, value, delta, suffix }: StatTileProps) {
  const showDelta = delta !== undefined && delta !== 0;
  const isPositive = delta && delta > 0;
  const isNegative = delta && delta < 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>
          {value}
          {suffix && <Text style={styles.suffix}>{suffix}</Text>}
        </Text>
        {showDelta && (
          <View
            style={[
              styles.deltaContainer,
              isPositive && styles.deltaPositive,
              isNegative && styles.deltaNegative,
            ]}
          >
            {isPositive && <TrendingUp size={12} color="#10b981" />}
            {isNegative && <TrendingDown size={12} color="#ef4444" />}
            {!isPositive && !isNegative && <Minus size={12} color="#6b7280" />}
            <Text
              style={[
                styles.deltaText,
                isPositive && styles.deltaTextPositive,
                isNegative && styles.deltaTextNegative,
              ]}
            >
              {Math.abs(delta)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  suffix: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6b7280',
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  deltaPositive: {
    backgroundColor: '#d1fae5',
  },
  deltaNegative: {
    backgroundColor: '#fee2e2',
  },
  deltaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  deltaTextPositive: {
    color: '#10b981',
  },
  deltaTextNegative: {
    color: '#ef4444',
  },
});
