import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Trash2, Clock, Calendar } from 'lucide-react-native';
import { DraftMeal, MealItem, MEAL_TYPES, MealType } from '@/types/meal';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AddEditMealSheetProps {
  visible: boolean;
  draftMeal: DraftMeal;
  onClose: () => void;
  onSave: () => void;
}

export function AddEditMealSheet({
  visible,
  draftMeal,
  onClose,
  onSave,
}: AddEditMealSheetProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<MealItem[]>(draftMeal.items);
  const [mealType, setMealType] = useState<MealType>(draftMeal.meal_type);
  const [loggedAt, setLoggedAt] = useState(draftMeal.logged_at);
  const [notes, setNotes] = useState(draftMeal.notes || '');
  const [saving, setSaving] = useState(false);

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    if (!user) return;

    setSaving(true);

    try {
      const { data: mealLog, error: mealError } = await supabase
        .from('meal_logs')
        .insert({
          user_id: user.id,
          meal_type: mealType,
          logged_at: loggedAt.toISOString(),
          total_calories: totals.calories,
          total_protein: totals.protein,
          total_carbs: totals.carbs,
          total_fat: totals.fat,
          photo_url: draftMeal.photo_url,
          notes,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      const mealLogItems = items.map((item) => ({
        meal_log_id: mealLog.id,
        food_item_id: item.food_item_id,
        food_name: item.name,
        portion_grams: item.portion_grams,
        calories: item.calories,
        protein_grams: item.protein,
        carbs_grams: item.carbs,
        fat_grams: item.fat,
      }));

      const { error: itemsError } = await supabase
        .from('meal_log_items')
        .insert(mealLogItems);

      if (itemsError) throw itemsError;

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', error.message || 'Failed to save meal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Meal</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Meal Type</Text>
            <View style={styles.mealTypeGrid}>
              {MEAL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.mealTypeButton,
                    mealType === type.value && styles.mealTypeButtonActive,
                  ]}
                  onPress={() => setMealType(type.value)}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      mealType === type.value && styles.mealTypeTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Time</Text>
            <View style={styles.timeRow}>
              <Clock size={20} color="#6b7280" />
              <Text style={styles.timeText}>
                {loggedAt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
              <Calendar size={20} color="#6b7280" />
              <Text style={styles.timeText}>
                {loggedAt.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Food Items</Text>
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPortion}>{item.portion_grams}g</Text>
                    <View style={styles.itemMacros}>
                      <Text style={styles.itemCalories}>
                        {Math.round(item.calories)} cal
                      </Text>
                      <Text style={styles.itemMacroText}>
                        P: {Math.round(item.protein)}g • C: {Math.round(item.carbs)}g
                        • F: {Math.round(item.fat)}g
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(index)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about this meal..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.totalsCard}>
            <Text style={styles.totalsTitle}>Total Nutrition</Text>
            <View style={styles.totalsRow}>
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{Math.round(totals.calories)}</Text>
                <Text style={styles.totalLabel}>Calories</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{Math.round(totals.protein)}g</Text>
                <Text style={styles.totalLabel}>Protein</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{Math.round(totals.carbs)}g</Text>
                <Text style={styles.totalLabel}>Carbs</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalValue}>{Math.round(totals.fat)}g</Text>
                <Text style={styles.totalLabel}>Fat</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Meal</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    paddingTop: 60,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  mealTypeButtonActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  mealTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  mealTypeTextActive: {
    color: '#059669',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginRight: 16,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemContent: {
    flex: 1,
    gap: 4,
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
  itemMacros: {
    marginTop: 4,
  },
  itemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  itemMacroText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 16,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
