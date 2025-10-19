import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HelpCircle, CheckCircle } from 'lucide-react-native';

interface InlineHintProps {
  itemName: string;
  question: string;
  options: Array<{ value: number; label: string }>;
  onAnswer: (value: number) => void;
  variant?: 'quantity' | 'portion' | 'category';
}

export function InlineHint({
  itemName,
  question,
  options,
  onAnswer,
  variant = 'quantity',
}: InlineHintProps) {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSelect = (value: number) => {
    setSelectedValue(value);
    setIsAnswered(true);
    onAnswer(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HelpCircle size={16} color="#3b82f6" />
        <Text style={styles.itemName}>{itemName}</Text>
        {isAnswered && <CheckCircle size={16} color="#10b981" />}
      </View>

      <Text style={styles.question}>{question}</Text>

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selectedValue === option.value && styles.optionButtonSelected,
            ]}
            onPress={() => handleSelect(option.value)}
            disabled={isAnswered}
          >
            <Text
              style={[
                styles.optionText,
                selectedValue === option.value && styles.optionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isAnswered && (
        <View style={styles.confirmBadge}>
          <Text style={styles.confirmText}>✓ Updated to {selectedValue}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e40af',
  },
  question: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    minWidth: 60,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  confirmBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    alignSelf: 'flex-start',
  },
  confirmText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
});
