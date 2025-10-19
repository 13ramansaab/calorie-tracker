import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { Clock, Sparkles } from 'lucide-react-native';
import { getMealTimeSuggestions } from '@/lib/ai/personalizationService';

interface MealTimeSuggestionsProps {
  userId: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onSelectItem: (item: string) => void;
}

export function MealTimeSuggestions({
  userId,
  mealType,
  onSelectItem,
}: MealTimeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, [userId, mealType]);

  const loadSuggestions = async () => {
    setLoading(true);
    const items = await getMealTimeSuggestions(userId, mealType);
    setSuggestions(items.slice(0, 6));
    setLoading(false);
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Clock size={16} color="#10b981" />
          <Text style={styles.title}>
            {mealType === 'breakfast'
              ? 'Your Usual Breakfast'
              : mealType === 'dinner'
                ? 'Your Usual Dinner'
                : 'Quick Add'}
          </Text>
        </View>
        <Sparkles size={14} color="#f59e0b" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => onSelectItem(item)}
          >
            <Text style={styles.suggestionText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  scrollContent: {
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
});
