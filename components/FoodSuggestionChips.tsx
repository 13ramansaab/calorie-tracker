import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';

interface FoodOption {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  fat_per_100g?: number;
}

interface FoodSuggestionChipsProps {
  options: FoodOption[];
  portionGrams: number;
  onSelect: (option: FoodOption) => void;
  selectedId?: string;
}

export function FoodSuggestionChips({
  options,
  portionGrams,
  onSelect,
  selectedId,
}: FoodSuggestionChipsProps) {
  if (options.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Suggestions:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chipsContainer}>
          {options.map((option) => {
            const isSelected = selectedId === option.id;
            const calories = Math.round(
              (option.calories_per_100g * portionGrams) / 100
            );

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => onSelect(option)}
              >
                {isSelected && (
                  <Check size={14} color="#ffffff" style={styles.checkIcon} />
                )}
                <View style={styles.chipContent}>
                  <Text
                    style={[styles.chipName, isSelected && styles.chipNameSelected]}
                    numberOfLines={1}
                  >
                    {option.name}
                  </Text>
                  <Text style={[styles.chipCals, isSelected && styles.chipCalsSelected]}>
                    {calories} cal
                  </Text>
                  {option.protein_per_100g !== undefined && (
                    <View style={styles.macrosRow}>
                      <Text
                        style={[styles.macroText, isSelected && styles.macroTextSelected]}
                      >
                        P: {Math.round((option.protein_per_100g * portionGrams) / 100)}g
                      </Text>
                      {option.carbs_per_100g !== undefined && (
                        <Text
                          style={[
                            styles.macroText,
                            isSelected && styles.macroTextSelected,
                          ]}
                        >
                          C: {Math.round((option.carbs_per_100g * portionGrams) / 100)}g
                        </Text>
                      )}
                      {option.fat_per_100g !== undefined && (
                        <Text
                          style={[
                            styles.macroText,
                            isSelected && styles.macroTextSelected,
                          ]}
                        >
                          F: {Math.round((option.fat_per_100g * portionGrams) / 100)}g
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    minWidth: 140,
    maxWidth: 180,
  },
  chipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkIcon: {
    marginRight: 6,
  },
  chipContent: {
    flex: 1,
    gap: 4,
  },
  chipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  chipNameSelected: {
    color: '#ffffff',
  },
  chipCals: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  chipCalsSelected: {
    color: '#ffffff',
    opacity: 0.9,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  macroText: {
    fontSize: 11,
    color: '#6b7280',
  },
  macroTextSelected: {
    color: '#ffffff',
    opacity: 0.8,
  },
});
