import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Trash2, Edit, Camera, MessageSquare } from 'lucide-react-native';
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
  photo_url: string | null;
  notes: string | null;
  source: 'manual' | 'photo' | 'ai';
  photo_analysis_id: string | null;
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

export default function MealDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [meal, setMeal] = useState<MealLog | null>(null);
  const [items, setItems] = useState<MealLogItem[]>([]);

  useEffect(() => {
    fetchMealDetails();
  }, [id]);

  const fetchMealDetails = async () => {
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
      console.error('Error fetching meal:', error);
      Alert.alert('Error', 'Failed to load meal details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('meal_logs')
                .delete()
                .eq('id', id);

              if (error) throw error;

              router.back();
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          },
        },
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
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Details</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteHeaderButton}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {meal.photo_url && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: meal.photo_url }} style={styles.photo} resizeMode="cover" />
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.mealTypeTag}>
              <Text style={styles.mealTypeText}>{meal.meal_type}</Text>
            </View>
            <Text style={styles.timeText}>
              {new Date(meal.logged_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.totalsSection}>
            <Text style={styles.totalCalories}>
              {Math.round(meal.total_calories)} cal
            </Text>
            <View style={styles.macrosRow}>
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
                <Text style={styles.macroValue}>{Math.round(meal.total_fat)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>

          <View style={styles.provenanceSection}>
            <Text style={styles.provenanceLabel}>Source</Text>
            <View style={styles.provenanceBadge}>
              {meal.source === 'photo' || meal.source === 'ai' ? (
                <Camera size={16} color="#3b82f6" />
              ) : null}
              <Text style={styles.provenanceText}>
                {meal.source === 'photo'
                  ? 'Photo + AI Analysis'
                  : meal.source === 'ai'
                    ? 'AI Analysis'
                    : 'Manual Entry'}
              </Text>
            </View>
            {meal.notes && (
              <View style={styles.userNoteBox}>
                <MessageSquare size={14} color="#10b981" />
                <Text style={styles.userNoteLabel}>Your note:</Text>
                <Text style={styles.userNoteText}>{meal.notes}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Items</Text>
          <View style={styles.itemsList}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.food_name}</Text>
                  <Text style={styles.itemPortion}>{item.portion_grams}g</Text>
                </View>
                <View style={styles.itemStats}>
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
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => Alert.alert('Coming Soon', 'Edit functionality will be added')}
        >
          <Edit size={20} color="#10b981" />
          <Text style={styles.editButtonText}>Edit Meal</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
  deleteHeaderButton: {
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
    height: 300,
    backgroundColor: '#000000',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTypeTag: {
    backgroundColor: '#d1fae5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalsSection: {
    gap: 16,
  },
  totalCalories: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 24,
  },
  macroItem: {
    gap: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
  },
  macroLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  provenanceSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  provenanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  provenanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
  },
  provenanceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
  },
  userNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  userNoteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  userNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  itemHeader: {
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
  itemStats: {
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
});
