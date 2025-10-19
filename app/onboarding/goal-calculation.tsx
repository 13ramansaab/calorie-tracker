import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { calculateCalorieTargets } from '@/utils/nutritionCalculations';
import { TrendingUp } from 'lucide-react-native';

export default function GoalCalculation() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [calculated, setCalculated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState({
    bmr: 0,
    tdee: 0,
    targetCalories: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
  });

  useEffect(() => {
    setTimeout(() => {
      const dateOfBirth = new Date(params.dateOfBirth as string);
      const age = new Date().getFullYear() - dateOfBirth.getFullYear();

      const result = calculateCalorieTargets({
        gender: params.gender as string,
        weightKg: parseFloat(params.currentWeightKg as string),
        heightCm: parseFloat(params.heightCm as string),
        age,
        activityLevel: params.activityLevel as string,
        goalType: params.goalType as string,
      });

      setTargets(result);
      setCalculated(true);
    }, 1500);
  }, []);

  const handleContinue = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const effectiveFrom = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        daily_calorie_target: targets.targetCalories,
        protein_target_grams: targets.proteinGrams,
        carbs_target_grams: targets.carbsGrams,
        fat_target_grams: targets.fatGrams,
        effective_from: effectiveFrom,
        macro_ratio: {
          protein: Math.round((targets.proteinGrams * 4 * 100) / targets.targetCalories),
          carbs: Math.round((targets.carbsGrams * 4 * 100) / targets.targetCalories),
          fat: Math.round((targets.fatGrams * 9 * 100) / targets.targetCalories),
        },
      });

      if (error) throw error;

      router.push('/onboarding/subscription');
    } catch (err) {
      console.error('Error saving goals:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={['#10b981', '#059669', '#047857']} style={styles.container}>
      <View style={styles.content}>
        {!calculated ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Calculating your nutrition plan...</Text>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <View style={styles.iconContainer}>
              <TrendingUp size={48} color="#ffffff" />
            </View>

            <View>
              <Text style={styles.title}>Your Personalized Plan</Text>
              <Text style={styles.subtitle}>
                Based on your profile and goals, here's your daily nutrition target
              </Text>
            </View>

            <View style={styles.metricsCard}>
              <View style={styles.mainMetric}>
                <Text style={styles.mainMetricValue}>{targets.targetCalories}</Text>
                <Text style={styles.mainMetricLabel}>Daily Calories</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.macroGrid}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{targets.proteinGrams}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{targets.carbsGrams}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{targets.fatGrams}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>

              <View style={styles.infoNote}>
                <Text style={styles.infoNoteText}>
                  BMR: {targets.bmr} cal • TDEE: {targets.tdee} cal
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.continueButton, saving && styles.continueButtonDisabled]}
              onPress={handleContinue}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#10b981" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  resultsContainer: {
    alignItems: 'center',
    gap: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  metricsCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    gap: 20,
  },
  mainMetric: {
    alignItems: 'center',
  },
  mainMetricValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#10b981',
  },
  mainMetricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  infoNote: {
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  infoNoteText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
});