import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Plus, MessageCircle, Flame, Award } from 'lucide-react-native';

interface DailySummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
}

interface Goal {
  daily_calorie_target: number;
  protein_target_grams: number;
  carbs_target_grams: number;
  fat_target_grams: number;
}

export default function HomeTab() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DailySummary>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    meals: 0,
  });
  const [goal, setGoal] = useState<Goal | null>(null);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .lte('effective_from', today)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalData) {
        setGoal(goalData);
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const { data: meals } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString())
        .order('logged_at', { ascending: false });

      if (meals) {
        setRecentMeals(meals);

        const dailySummary = meals.reduce(
          (acc, meal) => ({
            calories: acc.calories + (meal.total_calories || 0),
            protein: acc.protein + (meal.total_protein || 0),
            carbs: acc.carbs + (meal.total_carbs || 0),
            fat: acc.fat + (meal.total_fat || 0),
            meals: acc.meals + 1,
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
        );

        setSummary(dailySummary);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const calorieProgress = goal
    ? Math.min((summary.calories / goal.daily_calorie_target) * 100, 100)
    : 0;

  const remaining = goal ? goal.daily_calorie_target - summary.calories : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
      }
    >
      <LinearGradient colors={['#10b981', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Hello, {profile?.full_name || 'there'}!</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.calorieCard}>
          <View style={styles.calorieRingContainer}>
            <Svg width={180} height={180}>
              <Circle
                cx="90"
                cy="90"
                r="70"
                stroke="#e5e7eb"
                strokeWidth="16"
                fill="none"
              />
              <Circle
                cx="90"
                cy="90"
                r="70"
                stroke="#10b981"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${(calorieProgress / 100) * 440} 440`}
                strokeLinecap="round"
                rotation="-90"
                origin="90, 90"
              />
            </Svg>
            <View style={styles.calorieRingContent}>
              <Text style={styles.calorieValue}>{Math.round(summary.calories)}</Text>
              <Text style={styles.calorieLabel}>
                / {goal?.daily_calorie_target || 0}
              </Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>
          </View>

          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(summary.protein)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroTarget}>
                / {goal?.protein_target_grams || 0}g
              </Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(summary.carbs)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroTarget}>/ {goal?.carbs_target_grams || 0}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(summary.fat)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroTarget}>/ {goal?.fat_target_grams || 0}g</Text>
            </View>
          </View>

          {remaining > 0 && (
            <View style={styles.remainingCard}>
              <Flame size={20} color="#f59e0b" />
              <Text style={styles.remainingText}>
                {Math.round(remaining)} calories remaining
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => router.push('/(tabs)/log')}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.logButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Plus size={24} color="#ffffff" />
            <Text style={styles.logButtonText}>Log a Meal</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {recentMeals.length > 0 ? (
            <View style={styles.mealList}>
              {recentMeals.map((meal) => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.mealCard}
                  onPress={() => router.push(`/meal/${meal.id}`)}
                >
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTypeTag}>
                      <Text style={styles.mealTypeText}>
                        {meal.meal_type || 'Meal'}
                      </Text>
                    </View>
                    <Text style={styles.mealTime}>
                      {new Date(meal.logged_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.mealStats}>
                    <Text style={styles.mealCalories}>
                      {Math.round(meal.total_calories)} cal
                    </Text>
                    <Text style={styles.mealMacros}>
                      P: {Math.round(meal.total_protein)}g • C:{' '}
                      {Math.round(meal.total_carbs)}g • F:{' '}
                      {Math.round(meal.total_fat)}g
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No meals logged today</Text>
              <Text style={styles.emptySubtext}>
                Tap "Log a Meal" to get started
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/chat')}
          >
            <MessageCircle size={24} color="#10b981" />
            <Text style={styles.actionText}>Chat Assistant</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Award size={24} color="#10b981" />
            <Text style={styles.actionText}>Achievements</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    gap: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  date: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    paddingHorizontal: 24,
    marginTop: -16,
  },
  calorieCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 24,
  },
  calorieRingContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  calorieRingContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1f2937',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  calorieUnit: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  macroTarget: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  remainingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  logButton: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  logButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  mealList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeTag: {
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'capitalize',
  },
  mealTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  mealStats: {
    gap: 4,
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  mealMacros: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});
