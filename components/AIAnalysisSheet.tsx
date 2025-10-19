import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { X, Plus, Lightbulb, AlertCircle } from 'lucide-react-native';
import { AnalysisItemRow } from './AIComponents';
import { NumberInput } from './FormInput';
import { Chips } from './Chips';
import { ContextBanner } from './ContextBanner';
import { ConflictChipGroup } from './ConflictChipGroup';
import { AnalysisResponse, DetectedFood, ConflictDetection } from '@/types/ai';
import { analyzePhotoWithVision } from '@/lib/ai/visionService';
import { detectConflicts, resolveConflict } from '@/lib/ai/conflictDetection';
import {
  logNoteEntered,
  logNoteUsedInAnalysis,
  logNoteConflictShown,
  logConflictChoiceSelected,
} from '@/lib/ai/instrumentation';
import { mapDetectedFoodToDatabase } from '@/lib/ai/mappingService';
import {
  calculateOverallConfidence,
  calculatePortionHeuristic,
  shouldShowWarning,
} from '@/lib/ai/confidenceOrchestrator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AIAnalysisSheetProps {
  visible: boolean;
  photoUri?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  userNote?: string;
  onClose: () => void;
  onSave: (items: DetectedFood[], mealType: string, photoUri?: string) => void;
}

export function AIAnalysisSheet({
  visible,
  photoUri,
  mealType = 'lunch',
  userNote,
  onClose,
  onSave,
}: AIAnalysisSheetProps) {
  const { user, profile } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [foods, setFoods] = useState<DetectedFood[]>([]);
  const [selectedMealType, setSelectedMealType] = useState(mealType);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPortion, setEditingPortion] = useState(100);
  const [usedUserNote, setUsedUserNote] = useState(false);
  const [editingContext, setEditingContext] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictDetection[]>([]);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && photoUri && !analysis) {
      analyzePhoto();
    }
  }, [visible, photoUri]);

  const analyzePhoto = async () => {
    if (!photoUri || !user) return;

    setAnalyzing(true);

    try {
      const result = await analyzePhotoWithVision({
        type: 'photo',
        photoUri,
        mealType: selectedMealType,
        userContext: {
          region: profile?.region,
          dietaryPrefs: profile?.dietary_preferences,
          auxText: userNote,
        },
      });

      if (userNote && userNote.trim()) {
        setUsedUserNote(true);
        logNoteEntered(userNote.length, selectedMealType);
      }

      setAnalysis(result);

      const detectedConflicts = detectConflicts(result.foods, userNote);
      setConflicts(detectedConflicts);

      const mappedFoods = await Promise.all(
        result.foods.map(async (food) => {
          const mapped = await mapDetectedFoodToDatabase(
            food,
            profile?.region,
            profile?.dietary_preferences
          );

          const portionHeuristic = calculatePortionHeuristic(
            mapped.portion,
            food.portion
          );

          const overallConfidence = calculateOverallConfidence(
            food,
            mapped.confidence,
            portionHeuristic,
            !!profile?.region
          );

          return {
            ...food,
            name: mapped.name,
            portion: mapped.portion,
            calories: mapped.calories,
            protein: mapped.protein,
            carbs: mapped.carbs,
            fat: mapped.fat,
            confidence: overallConfidence,
          };
        })
      );

      setFoods(mappedFoods);

      const itemsInfluenced = mappedFoods.filter(
        (f) => f.noteInfluence && f.noteInfluence !== 'none'
      ).length;

      const influenceTypes = mappedFoods
        .filter((f) => f.noteInfluence && f.noteInfluence !== 'none')
        .map((f) => f.noteInfluence!);

      const { data: insertData, error: insertError } = await supabase
        .from('photo_analyses')
        .insert({
          user_id: user.id,
          photo_url: photoUri,
          raw_response: result,
          overall_confidence: result.overallConfidence,
          model_version: result.modelVersion,
          status: 'reviewed',
          user_note: userNote || null,
          note_used: !!userNote && itemsInfluenced > 0,
          note_influence_summary: mappedFoods
            .filter((f) => f.noteInfluence && f.noteInfluence !== 'none')
            .map((f) => ({
              item: f.name,
              influence: f.noteInfluence,
            })),
        })
        .select('id')
        .single();

      if (!insertError && insertData) {
        setAnalysisId(insertData.id);

        if (userNote && itemsInfluenced > 0) {
          logNoteUsedInAnalysis(insertData.id, itemsInfluenced, influenceTypes);
        }

        if (detectedConflicts.length > 0) {
          logNoteConflictShown(
            insertData.id,
            detectedConflicts.map((c) => ({
              itemName: c.itemName,
              conflictType: c.conflictType,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Analysis Failed', 'Please add items manually or try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleEditFood = (index: number) => {
    setEditingIndex(index);
    setEditingPortion(foods[index].portion);
  };

  const handleSavePortion = () => {
    if (editingIndex !== null) {
      const updatedFoods = [...foods];
      const food = updatedFoods[editingIndex];

      const ratio = editingPortion / food.portion;
      updatedFoods[editingIndex] = {
        ...food,
        portion: editingPortion,
        calories: Math.round(food.calories * ratio),
        protein: Math.round(food.protein * ratio * 10) / 10,
        carbs: Math.round(food.carbs * ratio * 10) / 10,
        fat: Math.round(food.fat * ratio * 10) / 10,
      };

      setFoods(updatedFoods);
      setEditingIndex(null);
    }
  };

  const handleRemoveFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (foods.length === 0) {
      Alert.alert('No Items', 'Please add at least one food item');
      return;
    }

    onSave(foods, selectedMealType, photoUri);
  };

  const hasLowConfidence = foods.some((f) => shouldShowWarning(f.confidence));
  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Analysis</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          )}

          {userNote && userNote.trim() && (
            <ContextBanner
              text={userNote}
              onEdit={editingContext ? undefined : () => setEditingContext(true)}
              confidenceImpact={usedUserNote ? 15 : undefined}
              collapsible
            />
          )}

          <View style={styles.mealTypeSection}>
            <Text style={styles.sectionLabel}>Meal Type</Text>
            <Chips
              options={[
                { label: 'Breakfast', value: 'breakfast' },
                { label: 'Lunch', value: 'lunch' },
                { label: 'Dinner', value: 'dinner' },
                { label: 'Snack', value: 'snack' },
              ]}
              selected={[selectedMealType]}
              onSelect={setSelectedMealType}
            />
          </View>

          {analyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.analyzingText}>Analyzing your meal...</Text>
              <Text style={styles.analyzingSubtext}>
                Identifying foods and calculating nutrition
              </Text>
            </View>
          ) : (
            <>
              {hasLowConfidence && (
                <View style={styles.warningBanner}>
                  <AlertCircle size={20} color="#f59e0b" />
                  <Text style={styles.warningText}>
                    Some items have low confidence. Please review carefully.
                  </Text>
                </View>
              )}

              {analysis && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Total Calories</Text>
                  <Text style={styles.summaryValue}>{totalCalories}</Text>
                  <Text style={styles.summaryItems}>{foods.length} items detected</Text>
                </View>
              )}

              <View style={styles.foodsList}>
                <Text style={styles.sectionLabel}>Detected Foods</Text>
                {foods.map((food, index) => {
                  const foodConflict = conflicts.find(
                    (c) => c.itemName === food.name
                  );

                  return (
                    <View key={index}>
                      {foodConflict && (
                        <ConflictChipGroup
                          itemName={foodConflict.itemName}
                          modelValue={foodConflict.modelValue}
                          noteValue={foodConflict.noteValue}
                          conflictType={foodConflict.conflictType}
                          onPick={(value, source) => {
                            const resolved = resolveConflict(food, value, source);
                            const updatedFoods = [...foods];
                            updatedFoods[index] = resolved;
                            setFoods(updatedFoods);

                            setConflicts(conflicts.filter((c) => c !== foodConflict));

                            if (analysisId) {
                              logConflictChoiceSelected(
                                analysisId,
                                foodConflict.itemName,
                                source,
                                foodConflict.conflictType
                              );
                            }
                          }}
                        />
                      )}

                      {editingIndex === index ? (
                        <View style={styles.editCard}>
                        <Text style={styles.editLabel}>{food.name}</Text>
                        <NumberInput
                          label="Portion"
                          value={editingPortion}
                          onChange={setEditingPortion}
                          unit="g"
                          min={1}
                          step={10}
                        />
                        <View style={styles.editActions}>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setEditingIndex(null)}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleSavePortion}
                          >
                            <Text style={styles.saveButtonText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                        ) : (
                          <AnalysisItemRow
                            name={food.name}
                            portion={food.portion}
                            calories={food.calories}
                            confidence={food.confidence}
                            onEdit={() => handleEditFood(index)}
                            onRemove={() => handleRemoveFood(index)}
                          />
                        )}
                    </View>
                  );
                })}
              </View>

              {analysis?.notes && (
                <View style={styles.notesCard}>
                  <Lightbulb size={16} color="#3b82f6" />
                  <Text style={styles.notesText}>{analysis.notes}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.addButton}>
                <Plus size={20} color="#10b981" />
                <Text style={styles.addButtonText}>Add Another Item</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, analyzing && styles.primaryButtonDisabled]}
            onPress={handleSave}
            disabled={analyzing || foods.length === 0}
          >
            <Text style={styles.primaryButtonText}>Save Meal</Text>
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
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  mealTypeSection: {
    gap: 8,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  analyzingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  analyzingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#6b7280',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
  },
  summaryCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 4,
  },
  summaryItems: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  foodsList: {
    gap: 12,
    marginBottom: 20,
  },
  editCard: {
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    gap: 12,
  },
  editLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  notesCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 16,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10b981',
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
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  primaryButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#10b981',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
