import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, RefreshCw, Plus, Sparkles, Lock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { checkPremiumStatus, showPremiumPrompt } from '@/utils/premium';

interface SuggestedMeal {
  id: string;
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image?: string;
}

interface DayPlan {
  date: string;
  meals: SuggestedMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export default function MealPlanner() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [weekPlan, setWeekPlan] = useState<DayPlan[]>([]);

  useEffect(() => {
    if (profile?.subscription_tier) {
      setIsPremium(checkPremiumStatus(profile.subscription_tier));
    }
  }, [profile]);

  const generatePlan = () => {
    if (!isPremium) {
      const prompt = showPremiumPrompt(
        'Premium Feature',
        'AI-powered meal planning is a premium feature. Upgrade to get personalized meal suggestions tailored to your goals.'
      );
      Alert.alert(prompt.title, prompt.message, prompt.buttons);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const mockPlan: DayPlan[] = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);

        return {
          date: date.toISOString(),
          meals: [
            {
              id: `${i}-1`,
              name: 'Greek Yogurt Bowl',
              mealType: 'breakfast',
              calories: 320,
              protein: 25,
              carbs: 35,
              fat: 8,
            },
            {
              id: `${i}-2`,
              name: 'Grilled Chicken Salad',
              mealType: 'lunch',
              calories: 450,
              protein: 40,
              carbs: 25,
              fat: 18,
            },
            {
              id: `${i}-3`,
              name: 'Salmon with Vegetables',
              mealType: 'dinner',
              calories: 520,
              protein: 42,
              carbs: 30,
              fat: 22,
            },
          ],
          totalCalories: 1290,
          totalProtein: 107,
          totalCarbs: 90,
          totalFat: 48,
        };
      });

      setWeekPlan(mockPlan);
      setLoading(false);
    }, 2000);
  };

  const handleSwapMeal = (dayIndex: number, mealIndex: number) => {
    if (!isPremium) return;
    Alert.alert('Coming Soon', 'Meal swapping will be available soon');
  };

  const handleAddToLog = (meal: SuggestedMeal) => {
    if (!isPremium) return;
    Alert.alert('Coming Soon', 'Adding planned meals to log will be available soon');
  };

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal Planner</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.centerContent}>
          <View style={styles.premiumCard}>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b']}
              style={styles.premiumBadge}
            >
              <Lock size={32} color="#ffffff" />
            </LinearGradient>
            <Text style={styles.premiumTitle}>Premium Feature</Text>
            <Text style={styles.premiumDescription}>
              Get AI-powered meal plans personalized to your goals, dietary preferences,
              and nutritional targets. Plans are generated weekly and can be customized.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>7-day personalized meal plans</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Swap meals to match your taste</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>One-tap add to your log</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>Macro-balanced suggestions</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.upgradeButton}>
              <LinearGradient
                colors={['#fbbf24', '#f59e0b']}
                style={styles.upgradeButtonGradient}
              >
                <Sparkles size={20} color="#ffffff" />
                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.premiumHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonLight}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.premiumHeaderTitle}>Meal Planner</Text>
          <Text style={styles.premiumHeaderSubtitle}>AI-powered suggestions</Text>
        </View>
        <View style={styles.backButtonLight} />
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {weekPlan.length === 0 ? (
          <View style={styles.emptyState}>
            <Sparkles size={48} color="#10b981" />
            <Text style={styles.emptyTitle}>Generate Your Meal Plan</Text>
            <Text style={styles.emptyDescription}>
              Get a personalized 7-day meal plan based on your goals and preferences
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generatePlan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <RefreshCw size={20} color="#ffffff" />
                  <Text style={styles.generateButtonText}>Generate Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.planContent}>
            <TouchableOpacity style={styles.regenerateButton} onPress={generatePlan}>
              <RefreshCw size={16} color="#10b981" />
              <Text style={styles.regenerateText}>Regenerate Plan</Text>
            </TouchableOpacity>

            {weekPlan.map((day, dayIndex) => (
              <View key={dayIndex} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayTitle}>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                      })}
                    </Text>
                    <Text style={styles.dayDate}>
                      {new Date(day.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.dayTotals}>
                    <Text style={styles.dayCalories}>{day.totalCalories} cal</Text>
                    <Text style={styles.dayMacros}>
                      P: {day.totalProtein}g • C: {day.totalCarbs}g • F: {day.totalFat}g
                    </Text>
                  </View>
                </View>

                <View style={styles.mealsList}>
                  {day.meals.map((meal, mealIndex) => (
                    <View key={meal.id} style={styles.mealCard}>
                      <View style={styles.mealHeader}>
                        <View style={styles.mealTypeTag}>
                          <Text style={styles.mealTypeTagText}>{meal.mealType}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.swapButton}
                          onPress={() => handleSwapMeal(dayIndex, mealIndex)}
                        >
                          <RefreshCw size={14} color="#6b7280" />
                          <Text style={styles.swapButtonText}>Swap</Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealNutrition}>
                        {meal.calories} cal • P: {meal.protein}g • C: {meal.carbs}g • F:{' '}
                        {meal.fat}g
                      </Text>

                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAddToLog(meal)}
                      >
                        <Plus size={16} color="#10b981" />
                        <Text style={styles.addButtonText}>Add to Log</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButtonLight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  premiumHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  premiumHeaderSubtitle: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {
    padding: 24,
  },
  premiumCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  premiumBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  premiumDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresList: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  featureText: {
    fontSize: 15,
    color: '#1f2937',
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  planContent: {
    gap: 16,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: '#ffffff',
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  dayCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  dayDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  dayTotals: {
    alignItems: 'flex-end',
  },
  dayCalories: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  dayMacros: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 8,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTypeTag: {
    backgroundColor: '#d1fae5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  mealTypeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'capitalize',
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  swapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  mealNutrition: {
    fontSize: 13,
    color: '#6b7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    backgroundColor: '#ffffff',
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
});
