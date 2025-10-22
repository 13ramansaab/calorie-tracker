import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Leaf, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type DietType = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'jain' | 'keto' | 'none';

export default function DietaryPreferencesScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [dietType, setDietType] = useState<DietType>('none');
  const [excludedFoods, setExcludedFoods] = useState<string[]>([]);
  const [foodInput, setFoodInput] = useState('');

  useEffect(() => {
    if (profile?.dietary_preferences) {
      const prefs = profile.dietary_preferences;
      setDietType(prefs.diet_type || 'none');
      setExcludedFoods(prefs.excluded_foods || []);
    }
  }, [profile]);

  const addExcludedFood = () => {
    if (foodInput.trim() && !excludedFoods.includes(foodInput.trim())) {
      setExcludedFoods([...excludedFoods, foodInput.trim()]);
      setFoodInput('');
    }
  };

  const removeExcludedFood = (food: string) => {
    setExcludedFoods(excludedFoods.filter((f) => f !== food));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          dietary_preferences: {
            diet_type: dietType,
            excluded_foods: excludedFoods,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      Alert.alert('Success', 'Dietary preferences saved successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save dietary preferences');
    } finally {
      setLoading(false);
    }
  };

  const dietOptions = [
    { value: 'none', label: 'None', icon: '🍽️' },
    { value: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
    { value: 'non_vegetarian', label: 'Non-Veg', icon: '🍗' },
    { value: 'vegan', label: 'Vegan', icon: '🌱' },
    { value: 'jain', label: 'Jain', icon: '🙏' },
    { value: 'keto', label: 'Keto', icon: '🥑' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dietary Preferences</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Leaf size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>Diet Type</Text>
            </View>
            <View style={styles.dietGrid}>
              {dietOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dietCard,
                    dietType === option.value && styles.dietCardActive,
                  ]}
                  onPress={() => setDietType(option.value as DietType)}
                >
                  <Text style={styles.dietIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.dietLabel,
                      dietType === option.value && styles.dietLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Exclude Specific Foods</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={foodInput}
                onChangeText={setFoodInput}
                placeholder="e.g., peanuts, dairy"
                placeholderTextColor="#9ca3af"
                onSubmitEditing={addExcludedFood}
              />
              <TouchableOpacity style={styles.addButton} onPress={addExcludedFood}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tagContainer}>
              {excludedFoods.map((food) => (
                <View key={food} style={styles.tag}>
                  <Text style={styles.tagText}>{food}</Text>
                  <TouchableOpacity onPress={() => removeExcludedFood(food)}>
                    <X size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  dietGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dietCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 8,
  },
  dietCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  dietIcon: {
    fontSize: 32,
  },
  dietLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  dietLabelActive: {
    color: '#10b981',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tagText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
