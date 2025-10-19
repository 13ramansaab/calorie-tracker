import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MessageSquare, RotateCw, Zap, Clock } from 'lucide-react-native';

interface ContextAssistBoxProps {
  value: string;
  onChange: (text: string) => void;
  maxLength?: number;
  placeholder?: string;
  examples?: string[];
  langHint?: string;
  repeatMealSuggestions?: Array<{
    label: string;
    items: string[];
    frequency: number;
  }>;
  onLengthWarning?: (warning: string) => void;
}

const DEFAULT_EXAMPLES = [
  '2 chapati + 1 bowl paneer bhurji',
  '1 cup dal + 1 katori rice',
  'idli (3) + sambar (1 katori)',
];

export function ContextAssistBox({
  value,
  onChange,
  maxLength = 140,
  placeholder = '2 chapati + 1 bowl paneer bhurji',
  examples = DEFAULT_EXAMPLES,
  langHint,
  repeatMealSuggestions = [],
  onLengthWarning,
}: ContextAssistBoxProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [showLengthWarning, setShowLengthWarning] = useState(false);

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  useEffect(() => {
    if (isOverLimit) {
      setShowLengthWarning(true);
      onLengthWarning?.('Keep it short—counts and units work best.');

      const timer = setTimeout(() => {
        setShowLengthWarning(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShowLengthWarning(false);
    }
  }, [isOverLimit, onLengthWarning]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIndex((prev) => (prev + 1) % examples.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [examples.length]);

  const rotatingExample = examples[currentExampleIndex];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MessageSquare size={18} color="#10b981" />
          <Text style={styles.title}>Add a quick note (optional)</Text>
        </View>
      </View>

      {!isFocused && !value && (
        <View style={styles.rotatingHintContainer}>
          <RotateCw size={14} color="#9ca3af" />
          <Text style={styles.rotatingHint}>{rotatingExample}</Text>
        </View>
      )}

      {repeatMealSuggestions.length > 0 && (
        <View style={styles.repeatSuggestionsSection}>
          <View style={styles.repeatHeader}>
            <Clock size={14} color="#10b981" />
            <Text style={styles.repeatTitle}>Repeat Meals</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.repeatScroll}
          >
            {repeatMealSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.repeatChip}
                onPress={() => {
                  onChange(suggestion.items.join(' + '));
                  setShowExamples(false);
                }}
                activeOpacity={0.7}
              >
                <Zap size={12} color="#059669" />
                <Text style={styles.repeatLabel}>{suggestion.label}</Text>
                <View style={styles.frequencyBadge}>
                  <Text style={styles.frequencyText}>{suggestion.frequency}x</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            isOverLimit && styles.inputError,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={value}
          onChangeText={onChange}
          onFocus={() => {
            setIsFocused(true);
            setShowExamples(true);
          }}
          onBlur={() => setIsFocused(false)}
          multiline
          numberOfLines={2}
          maxLength={maxLength}
        />
        <View style={styles.inputFooter}>
          {langHint && (
            <Text style={styles.langHint}>{langHint}</Text>
          )}
          <Text
            style={[
              styles.charCount,
              isNearLimit && styles.charCountWarning,
              isOverLimit && styles.charCountError,
            ]}
          >
            {charCount}/{maxLength}
          </Text>
        </View>
      </View>

      {showExamples && examples.length > 0 && (
        <View style={styles.examplesSection}>
          <View style={styles.examplesHeader}>
            <Text style={styles.examplesTitle}>Quick Examples</Text>
            <TouchableOpacity onPress={() => setShowExamples(false)}>
              <Text style={styles.examplesHide}>Hide</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.examplesScroll}
            contentContainerStyle={styles.examplesContent}
          >
            {examples.map((example, index) => (
              <TouchableOpacity
                key={index}
                style={styles.exampleChip}
                onPress={() => {
                  onChange(example);
                  setShowExamples(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.exampleText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {!showExamples && value.length === 0 && (
        <TouchableOpacity
          style={styles.showExamplesButton}
          onPress={() => setShowExamples(true)}
        >
          <Text style={styles.showExamplesText}>Show examples</Text>
        </TouchableOpacity>
      )}

      {showLengthWarning && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Keep it short—counts and units work best.
          </Text>
        </View>
      )}

      {!showLengthWarning && (value.length > 0 || isFocused) && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Tip: add counts like '2 chapati' or units like '1 katori dal' to improve accuracy.
            {langHint && (
              <Text style={styles.langHintText}>
                {' '}
                • {langHint}
              </Text>
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  rotatingHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  rotatingHint: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    fontStyle: 'italic',
  },
  inputWrapper: {
    gap: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1f2937',
    minHeight: 70,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: '#10b981',
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  langHint: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  charCount: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  charCountWarning: {
    color: '#f59e0b',
  },
  charCountError: {
    color: '#ef4444',
  },
  examplesSection: {
    gap: 8,
  },
  examplesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examplesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  examplesHide: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  examplesScroll: {
    marginHorizontal: -4,
  },
  examplesContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  exampleChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  exampleText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  showExamplesButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  showExamplesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  infoBox: {
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 16,
  },
  langHintText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  warningBox: {
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },
  repeatSuggestionsSection: {
    gap: 8,
    marginBottom: 12,
  },
  repeatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repeatTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  repeatScroll: {
    marginHorizontal: -4,
  },
  repeatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#86efac',
    marginRight: 8,
  },
  repeatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  frequencyBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#10b981',
  },
  frequencyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
});
