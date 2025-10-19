import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, RefreshCw, Info } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface MealLog {
  id: string;
  meal_type: string;
  logged_at: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  photo_url: string;
}

interface MealLogItem {
  id: string;
  food_name: string;
  portion_grams: number;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
}

export default function PhotoDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<MealLog | null>(null);
  const [items, setItems] = useState<MealLogItem[]>([]);

  useEffect(() => {
    fetchPhotoDetails();
  }, [id]);

  const fetchPhotoDetails = async () => {
    if (!user || !id) return;

    try {
      const { data: mealData, error: mealError } = await supabase
        .from('meal_logs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (mealError) throw mealError;
      setMeal(mealData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('meal_log_items')
        .select('*')
        .eq('meal_log_id', id);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching photo:', error);
      Alert.alert('Error', 'Failed to load photo details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = () => {
    Alert.alert(
      'Premium Feature',
      'Re-analyzing photos with AI is a premium feature. Upgrade to access advanced analysis capabilities.',
      [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => {} },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!meal) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Details</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: meal.photo_url }} style={styles.photo} resizeMode="contain" />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View>
              <View style={styles.mealTypeTag}>
                <Text style={styles.mealTypeText}>{meal.meal_type}</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(meal.logged_at).toLocaleString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <TouchableOpacity style={styles.reanalyzeButton} onPress={handleReanalyze}>
              <RefreshCw size={20} color="#10b981" />
              <Text style={styles.reanalyzeText}>Re-analyze</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.nutritionSummary}>
            <View style={styles.caloriesBadge}>
              <Text style={styles.caloriesValue}>
                {Math.round(meal.total_calories)}
              </Text>
              <Text style={styles.caloriesLabel}>calories</Text>
            </View>
            <View style={styles.macrosGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>
                  {Math.round(meal.total_protein)}g
                </Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>
                  {Math.round(meal.total_carbs)}g
                </Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>
                  {Math.round(meal.total_fat)}g
                </Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Detected Items</Text>
            <View style={styles.aiTag}>
              <Info size={12} color="#3b82f6" />
              <Text style={styles.aiTagText}>AI Analyzed</Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.id} style={styles.detectedItem}>
                <View style={styles.itemContent}>
                  <Text style={styles.itemName}>{item.food_name}</Text>
                  <Text style={styles.itemPortion}>{item.portion_grams}g</Text>
                </View>
                <View style={styles.itemNutrition}>
                  <Text style={styles.itemCalories}>
                    {Math.round(item.calories)} cal
                  </Text>
                  <Text style={styles.itemMacros}>
                    P: {Math.round(item.protein_grams)}g • C:{' '}
                    {Math.round(item.carbs_grams)}g • F:{' '}
                    {Math.round(item.fat_grams)}g
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.tipCard}>
            <Info size={16} color="#3b82f6" />
            <Text style={styles.tipText}>
              You can edit meal details anytime from the meal detail screen
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.viewMealButton}
          onPress={() => router.push(`/meal/${meal.id}`)}
        >
          <Text style={styles.viewMealButtonText}>View Full Meal Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  photoContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    gap: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mealTypeTag: {
    backgroundColor: '#d1fae5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  mealTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  reanalyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  reanalyzeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  nutritionSummary: {
    gap: 16,
  },
  caloriesBadge: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10b981',
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#059669',
    marginTop: 4,
  },
  macrosGrid: {
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
  section: {
    padding: 24,
    backgroundColor: '#ffffff',
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  itemsList: {
    gap: 12,
  },
  detectedItem: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemPortion: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemNutrition: {
    gap: 4,
  },
  itemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  itemMacros: {
    fontSize: 12,
    color: '#6b7280',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
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
  viewMealButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewMealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
