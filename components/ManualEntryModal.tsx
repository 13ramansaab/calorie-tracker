import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Sparkles, Check } from 'lucide-react-native';
import { parseMealText } from '@/lib/ai/textService';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  userRegion?: string;
  dietaryPrefs?: any;
}

interface ParsedMeal {
  items: {
    name: string;
    portion: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export function ManualEntryModal({
  visible,
  onClose,
  userId,
  userRegion,
  dietaryPrefs,
}: ManualEntryModalProps) {
  const [mealText, setMealText] = useState('');
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>('lunch');
  const [analyzing, setAnalyzing] = useState(false);
  const [parsedMeal, setParsedMeal] = useState<ParsedMeal | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAnalyze = async () => {
    if (!mealText.trim()) {
      Alert.alert('Invalid Input', 'Please enter a meal description');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await parseMealText(mealText.trim(), userRegion, dietaryPrefs);
      setParsedMeal(result);
    } catch (error) {
      console.error('Error parsing meal:', error);
      Alert.alert(
        'Analysis Failed',
        'Unable to analyze your meal. Please try again with a different description.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogMeal = async () => {
    if (!parsedMeal || !userId) return;

    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase');

      const {error} = await supabase.from('meal_logs').insert({
        user_id: userId,
        meal_type: mealType,
        logged_at: new Date().toISOString(),
        calories: parsedMeal.totalCalories,
        protein_grams: parsedMeal.totalProtein,
        carbs_grams: parsedMeal.totalCarbs,
        fat_grams: parsedMeal.totalFat,
        source: 'manual_text',
      });

      if (error) throw error;

      Alert.alert('Success', 'Meal logged successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setMealText('');
            setParsedMeal(null);
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setMealText('');
    setParsedMeal(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Meal Manually</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputSection}>
              <View style={styles.labelRow}>
                <Sparkles size={18} color="#10b981" />
                <Text style={styles.label}>Describe Your Meal</Text>
              </View>
              <TextInput
                style={styles.textArea}
                value={mealText}
                onChangeText={setMealText}
                placeholder="e.g., 2 chapatis with 1 bowl rajma sabzi"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!analyzing && !parsedMeal}
              />
              <Text style={styles.hint}>
                Type naturally! Examples: "1 idli sambar", "100g Greek yogurt (175g has 18g protein)", "2 chapatis + dal"
              </Text>
            </View>

            <View style={styles.mealTypeSection}>
              <Text style={styles.label}>Meal Type</Text>
              <View style={styles.mealTypeChips}>
                {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      mealType === type && styles.chipActive,
                    ]}
                    onPress={() => setMealType(type)}
                    disabled={analyzing || saving}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        mealType === type && styles.chipTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {!parsedMeal ? (
              <TouchableOpacity
                style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
                onPress={handleAnalyze}
                disabled={analyzing || !mealText.trim()}
                activeOpacity={0.7}
              >
                {analyzing ? (
                  <>
                    <ActivityIndicator color="#ffffff" size="small" />
                    <Text style={styles.analyzeButtonText}>Analyzing...</Text>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} color="#ffffff" />
                    <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.resultsCard}>
                <View style={styles.resultsHeader}>
                  <View style={styles.resultsHeaderLeft}>
                    <Check size={20} color="#10b981" />
                    <Text style={styles.resultsTitle}>Estimated Nutrition</Text>
                  </View>
                  <TouchableOpacity onPress={() => setParsedMeal(null)} activeOpacity={0.7}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.resultsGrid}>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultValue}>{Math.round(parsedMeal.totalCalories)}</Text>
                    <Text style={styles.resultLabel}>Calories</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultValue}>{Math.round(parsedMeal.totalProtein)}g</Text>
                    <Text style={styles.resultLabel}>Protein</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultValue}>{Math.round(parsedMeal.totalCarbs)}g</Text>
                    <Text style={styles.resultLabel}>Carbs</Text>
                  </View>
                  <View style={styles.resultItem}>
                    <Text style={styles.resultValue}>{Math.round(parsedMeal.totalFat)}g</Text>
                    <Text style={styles.resultLabel}>Fat</Text>
                  </View>
                </View>

                {parsedMeal.items.length > 0 && (
                  <View style={styles.itemsList}>
                    <Text style={styles.itemsTitle}>Detected Items:</Text>
                    {parsedMeal.items.map((item, index) => (
                      <View key={index} style={styles.item}>
                        <Text style={styles.itemName}>
                          • {item.name} ({item.portion} {item.unit})
                        </Text>
                        <Text style={styles.itemStats}>
                          {Math.round(item.calories)} cal • {Math.round(item.protein)}g P
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.logButton, saving && styles.logButtonDisabled]}
                  onPress={handleLogMeal}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Check size={20} color="#ffffff" />
                      <Text style={styles.logButtonText}>Log Meal</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 24,
    gap: 24,
  },
  inputSection: {
    gap: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minHeight: 120,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  mealTypeSection: {
    gap: 12,
  },
  mealTypeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  resultsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    gap: 20,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  resultItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  itemsList: {
    gap: 12,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
  },
  item: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
