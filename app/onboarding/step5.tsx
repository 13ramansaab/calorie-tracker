import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ProgressBar } from '@/components/ProgressBar';
import { ChevronLeft, X } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type DietaryPattern = 'vegetarian' | 'non_vegetarian' | 'vegan' | 'pescatarian';

const dietaryOptions: { id: DietaryPattern; label: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'non_vegetarian', label: 'Non-Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'pescatarian', label: 'Pescatarian' },
];

export default function OnboardingStep5() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, refreshProfile } = useAuth();
  const [dietaryPattern, setDietaryPattern] = useState<DietaryPattern | null>(null);
  const [allergyInput, setAllergyInput] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addAllergy = () => {
    const trimmed = allergyInput.trim();
    if (trimmed && !allergies.includes(trimmed)) {
      setAllergies([...allergies, trimmed]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter((a) => a !== allergy));
  };

  const handleFinish = async () => {
    if (!dietaryPattern || !user) return;

    setLoading(true);
    setError('');

    try {
      const dateOfBirth = new Date(params.dateOfBirth as string);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: params.fullName,
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          gender: params.gender,
          height_cm: parseFloat(params.heightCm as string),
          current_weight_kg: parseFloat(params.currentWeightKg as string),
          goal_weight_kg: parseFloat(params.targetWeightKg as string),
          activity_level: params.activityLevel,
          preferences: {
            dietary_pattern: dietaryPattern,
            allergies,
          },
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();

      router.push({
        pathname: '/onboarding/goal-calculation',
        params: {
          ...params,
          dietaryPattern,
          allergies: JSON.stringify(allergies),
        },
      });
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const isValid = dietaryPattern !== null;

  return (
    <View style={styles.container}>
      <ProgressBar current={5} total={5} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Dietary preferences</Text>
            <Text style={styles.subtitle}>
              Help us suggest meals that match your lifestyle
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Dietary Pattern</Text>
              <View style={styles.dietaryGrid}>
                {dietaryOptions.map((option) => {
                  const isSelected = dietaryPattern === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.dietaryButton,
                        isSelected && styles.dietaryButtonActive,
                      ]}
                      onPress={() => setDietaryPattern(option.id)}
                    >
                      <Text
                        style={[
                          styles.dietaryButtonText,
                          isSelected && styles.dietaryButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Allergies (Optional)</Text>
              <View style={styles.allergyInputContainer}>
                <TextInput
                  style={styles.allergyInput}
                  placeholder="Add allergy or food sensitivity"
                  value={allergyInput}
                  onChangeText={setAllergyInput}
                  onSubmitEditing={addAllergy}
                  returnKeyType="done"
                />
                {allergyInput.trim() ? (
                  <TouchableOpacity onPress={addAllergy} style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {allergies.length > 0 && (
                <View style={styles.allergyTags}>
                  {allergies.map((allergy) => (
                    <View key={allergy} style={styles.allergyTag}>
                      <Text style={styles.allergyTagText}>{allergy}</Text>
                      <TouchableOpacity onPress={() => removeAllergy(allergy)}>
                        <X size={16} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.finishButton,
            (!isValid || loading) && styles.finishButtonDisabled,
          ]}
          onPress={handleFinish}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.finishButtonText}>Finish</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  form: {
    gap: 32,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dietaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  dietaryButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  dietaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  dietaryButtonTextActive: {
    color: '#059669',
  },
  allergyInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  allergyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  allergyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  allergyTagText: {
    fontSize: 14,
    color: '#374151',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  finishButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
