import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';

interface ConflictReconcileChipProps {
  aiSuggestion: string;
  userSuggestion: string;
  onSelectAI: () => void;
  onSelectUser: () => void;
}

export function ConflictReconcileChip({
  aiSuggestion,
  userSuggestion,
  onSelectAI,
  onSelectUser,
}: ConflictReconcileChipProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={16} color="#f59e0b" />
        <Text style={styles.title}>Detected Conflict</Text>
      </View>

      <Text style={styles.description}>
        We found different information from the photo and your note
      </Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={onSelectAI}
          activeOpacity={0.7}
        >
          <View style={styles.optionBadge}>
            <Text style={styles.optionBadgeText}>AI</Text>
          </View>
          <Text style={styles.optionText}>{aiSuggestion}</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <Text style={styles.dividerText}>or</Text>
        </View>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={onSelectUser}
          activeOpacity={0.7}
        >
          <View style={[styles.optionBadge, styles.optionBadgeUser]}>
            <Text style={styles.optionBadgeText}>You</Text>
          </View>
          <Text style={styles.optionText}>{userSuggestion}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
    marginBottom: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  description: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  optionsContainer: {
    gap: 8,
    marginTop: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fde68a',
  },
  optionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  optionBadgeUser: {
    backgroundColor: '#10b981',
  },
  optionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  divider: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
  },
});
