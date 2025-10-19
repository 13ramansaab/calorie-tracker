import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sparkles, User, CheckCircle2 } from 'lucide-react-native';

interface ConflictChipGroupProps {
  itemName: string;
  modelValue: string | number;
  noteValue: string | number;
  onPick: (value: string | number, source: 'model' | 'note') => void;
  conflictType?: 'quantity' | 'portion' | 'name';
  selectedSource?: 'model' | 'note' | null;
}

export function ConflictChipGroup({
  itemName,
  modelValue,
  noteValue,
  onPick,
  conflictType = 'quantity',
  selectedSource = null,
}: ConflictChipGroupProps) {
  const formatValue = (value: string | number): string => {
    if (conflictType === 'portion') {
      return `${value}g`;
    }
    if (conflictType === 'quantity') {
      return `${value}`;
    }
    return String(value);
  };

  const getConflictLabel = (): string => {
    if (conflictType === 'quantity') return 'Count differs';
    if (conflictType === 'portion') return 'Portion differs';
    return 'Name differs';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.itemName}>{itemName}</Text>
        <View style={styles.conflictBadge}>
          <Text style={styles.conflictText}>{getConflictLabel()}</Text>
        </View>
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionText}>Which looks right?</Text>
      </View>

      <View style={styles.chipsContainer}>
        <TouchableOpacity
          style={[
            styles.chip,
            styles.chipAI,
            selectedSource === 'model' && styles.chipSelected,
          ]}
          onPress={() => onPick(modelValue, 'model')}
          activeOpacity={0.7}
        >
          <View style={styles.chipHeader}>
            <View style={[styles.sourceBadge, styles.sourceBadgeAI]}>
              <Sparkles size={12} color="#ffffff" />
              <Text style={styles.sourceBadgeText}>AI</Text>
            </View>
            {selectedSource === 'model' && (
              <CheckCircle2 size={16} color="#3b82f6" />
            )}
          </View>
          <Text style={styles.chipValue}>{formatValue(modelValue)}</Text>
          <Text style={styles.chipLabel}>
            {formatValue(modelValue)} {itemName} (from photo)
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[
            styles.chip,
            styles.chipUser,
            selectedSource === 'note' && styles.chipSelected,
          ]}
          onPress={() => onPick(noteValue, 'note')}
          activeOpacity={0.7}
        >
          <View style={styles.chipHeader}>
            <View style={[styles.sourceBadge, styles.sourceBadgeUser]}>
              <User size={12} color="#ffffff" />
              <Text style={styles.sourceBadgeText}>You</Text>
            </View>
            {selectedSource === 'note' && (
              <CheckCircle2 size={16} color="#10b981" />
            )}
          </View>
          <Text style={styles.chipValue}>{formatValue(noteValue)}</Text>
          <Text style={styles.chipLabel}>
            {formatValue(noteValue)} {itemName} (from your note)
          </Text>
        </TouchableOpacity>
      </View>

      {selectedSource && (
        <View style={styles.confirmNote}>
          <Text style={styles.confirmText}>
            ✓ Using {selectedSource === 'model' ? 'AI' : 'your'} suggestion
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#78350f',
  },
  conflictBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#fbbf24',
  },
  conflictText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
    textTransform: 'uppercase',
  },
  description: {
    paddingBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  chipsContainer: {
    gap: 10,
  },
  chip: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    gap: 8,
  },
  chipAI: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  chipUser: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  chipSelected: {
    borderWidth: 3,
  },
  chipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  sourceBadgeAI: {
    backgroundColor: '#3b82f6',
  },
  sourceBadgeUser: {
    backgroundColor: '#10b981',
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  chipValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  chipLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#fde68a',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  confirmNote: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    alignSelf: 'flex-start',
  },
  confirmText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
});
