import { View, Text, StyleSheet } from 'react-native';

interface MacroBarProps {
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

export function MacroBar({ protein, carbs, fat }: MacroBarProps) {
  const proteinPercent = Math.min((protein.current / protein.target) * 100, 100);
  const carbsPercent = Math.min((carbs.current / carbs.target) * 100, 100);
  const fatPercent = Math.min((fat.current / fat.target) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.macroItem}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>
            {Math.round(protein.current)}g / {protein.target}g
          </Text>
        </View>
        <View style={styles.barContainer}>
          <View
            style={[
              styles.barFill,
              styles.proteinBar,
              { width: `${proteinPercent}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.macroItem}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>
            {Math.round(carbs.current)}g / {carbs.target}g
          </Text>
        </View>
        <View style={styles.barContainer}>
          <View
            style={[styles.barFill, styles.carbsBar, { width: `${carbsPercent}%` }]}
          />
        </View>
      </View>

      <View style={styles.macroItem}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>
            {Math.round(fat.current)}g / {fat.target}g
          </Text>
        </View>
        <View style={styles.barContainer}>
          <View style={[styles.barFill, styles.fatBar, { width: `${fatPercent}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  macroItem: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  macroValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  barContainer: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  proteinBar: {
    backgroundColor: '#3b82f6',
  },
  carbsBar: {
    backgroundColor: '#fbbf24',
  },
  fatBar: {
    backgroundColor: '#ef4444',
  },
});
