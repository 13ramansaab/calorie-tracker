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
import { ChevronLeft, Target, Flame, Drumstick, Wheat, Droplet } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type GoalType = 'weight_loss' | 'maintenance' | 'muscle_gain';

export default function NutritionGoalsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [goalType, setGoalType] = useState<GoalType>('maintenance');
  const [calorieGoal, setCalorieGoal] = useState('');
  const [proteinGoal, setProteinGoal] = useState('');
  const [carbsGoal, setCarbsGoal] = useState('');
  const [fatGoal, setFatGoal] = useState('');
  const [goalWeightKg, setGoalWeightKg] = useState('');

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      const { data: goal } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goal) {
        setGoalType((goal.goal_type as GoalType) || 'maintenance');
        setCalorieGoal(goal.daily_calorie_target?.toString() || '');
        setProteinGoal(goal.protein_target_grams?.toString() || '');
        setCarbsGoal(goal.carbs_target_grams?.toString() || '');
        setFatGoal(goal.fat_target_grams?.toString() || '');
      }

      if (profile?.goal_weight_kg) {
        setGoalWeightKg(profile.goal_weight_kg.toString());
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const calculateProgress = (current: number, goal: number): number => {
    if (!goal) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const renderProgressRing = (progress: number, color: string, label: string, value: string) => {
    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={styles.progressRing}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.progressCenter}>
          <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
        </View>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressSubtext}>{value}</Text>
      </View>
    );
  };

  const handleSave = async () => {
    if (!user) return;

    if (!calorieGoal || !proteinGoal || !carbsGoal || !fatGoal) {
      Alert.alert('Validation Error', 'Please fill in all nutrition goals');
      return;
    }

    const calories = parseFloat(calorieGoal);
    const protein = parseFloat(proteinGoal);
    const carbs = parseFloat(carbsGoal);
    const fat = parseFloat(fatGoal);

    if (calories < 1000 || calories > 5000) {
      Alert.alert('Validation Error', 'Calorie goal must be between 1000-5000');
      return;
    }

    if (protein < 30 || protein > 500) {
      Alert.alert('Validation Error', 'Protein goal must be between 30-500g');
      return;
    }

    setLoading(true);
    try {
      const { error: goalError } = await supabase.from('goals').insert({
        user_id: user.id,
        goal_type: goalType,
        daily_calorie_target: calories,
        protein_target_grams: protein,
        carbs_target_grams: carbs,
        fat_target_grams: fat,
        effective_from: new Date().toISOString(),
      });

      if (goalError) throw goalError;

      if (goalWeightKg) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            goal_weight_kg: parseFloat(goalWeightKg),
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      await refreshProfile();
      Alert.alert('Success', 'Nutrition goals updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving goals:', error);
      Alert.alert('Error', 'Failed to save nutrition goals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition Goals</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Target size={20} color="#10b981" />
              <Text style={styles.label}>Goal Type</Text>
            </View>
            <View style={styles.goalTypeGrid}>
              {[
                { value: 'weight_loss', label: 'Weight Loss', icon: '🔥' },
                { value: 'maintenance', label: 'Maintenance', icon: '⚖️' },
                { value: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.goalTypeCard,
                    goalType === option.value && styles.goalTypeCardActive,
                  ]}
                  onPress={() => setGoalType(option.value as GoalType)}
                >
                  <Text style={styles.goalTypeIcon}>{option.icon}</Text>
                  <Text
                    style={[
                      styles.goalTypeText,
                      goalType === option.value && styles.goalTypeTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Daily Targets</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.progressRings}
            >
              {renderProgressRing(75, '#10b981', 'Calories', `${calorieGoal || 0} kcal`)}
              {renderProgressRing(80, '#3b82f6', 'Protein', `${proteinGoal || 0}g`)}
              {renderProgressRing(70, '#f59e0b', 'Carbs', `${carbsGoal || 0}g`)}
              {renderProgressRing(85, '#ef4444', 'Fat', `${fatGoal || 0}g`)}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Flame size={20} color="#10b981" />
              <Text style={styles.label}>Daily Calorie Goal</Text>
            </View>
            <TextInput
              style={styles.input}
              value={calorieGoal}
              onChangeText={setCalorieGoal}
              placeholder="e.g., 2000"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Recommended: 1500-2500 kcal for most adults</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Drumstick size={20} color="#3b82f6" />
              <Text style={styles.label}>Protein Goal (grams)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={proteinGoal}
              onChangeText={setProteinGoal}
              placeholder="e.g., 150"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Recommended: 1.6-2.2g per kg body weight</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Wheat size={20} color="#f59e0b" />
              <Text style={styles.label}>Carbs Goal (grams)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={carbsGoal}
              onChangeText={setCarbsGoal}
              placeholder="e.g., 200"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Recommended: 45-65% of total calories</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Droplet size={20} color="#ef4444" />
              <Text style={styles.label}>Fat Goal (grams)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={fatGoal}
              onChangeText={setFatGoal}
              placeholder="e.g., 65"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
            />
            <Text style={styles.hint}>Recommended: 20-35% of total calories</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Target size={20} color="#10b981" />
              <Text style={styles.label}>Goal Weight (kg)</Text>
            </View>
            <TextInput
              style={styles.input}
              value={goalWeightKg}
              onChangeText={setGoalWeightKg}
              placeholder="e.g., 70"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
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
            <Text style={styles.saveButtonText}>Save Goals</Text>
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
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  goalTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  goalTypeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    gap: 8,
  },
  goalTypeCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  goalTypeIcon: {
    fontSize: 32,
  },
  goalTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  goalTypeTextActive: {
    color: '#10b981',
  },
  progressSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  progressRings: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 10,
  },
  progressRing: {
    alignItems: 'center',
    gap: 8,
  },
  progressCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  progressSubtext: {
    fontSize: 12,
    color: '#6b7280',
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
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
