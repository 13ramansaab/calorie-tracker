import { supabase } from '@/lib/supabase';
import { analyzePhotoWithVision } from './visionService';
import { analyzeTextOnly } from './textService';
import { mapDetectedFoodToDatabase } from './mappingService';
import { loadSynonyms, normalizeUserNote } from './multilingualService';
import { detectContradictoryNote, validateNoteLength, sanitizeNoteForStorage } from './edgeCasePolicies';
import { applyPresetToPortion } from './unitPresets';
import { applyUserPriors, getUserPortionPriors } from './personalizationService';
import { logEvent } from './instrumentation';
import { DetectedFood, AnalysisResponse } from '@/types/ai';

export interface AnalysisOptions {
  photoUri?: string;
  userNote?: string;
  mealType?: string;
  userId: string;
  userRegion?: string;
  dietaryPrefs?: string[];
}

export interface AnalysisResult {
  analysisId: string;
  foods: DetectedFood[];
  totalCalories: number;
  overallConfidence: number;
  usedNote: boolean;
  noteConflict: boolean;
  conflicts: any[];
  warnings: string[];
}

export async function runPhotoAnalysis(options: AnalysisOptions): Promise<AnalysisResult> {
  const { photoUri, userNote, mealType = 'lunch', userId, userRegion, dietaryPrefs } = options;

  if (!photoUri) {
    throw new Error('Photo URI is required for photo analysis');
  }

  const warnings: string[] = [];
  let sanitizedNote: string | undefined;
  let noteConflict = false;

  if (userNote) {
    const validation = validateNoteLength(userNote, 140);
    if (!validation.isValid) {
      warnings.push(validation.warning || 'Note was too long and has been trimmed');
      sanitizedNote = validation.trimmedNote;
    } else {
      sanitizedNote = userNote;
    }

    const synonyms = await loadSynonyms();
    sanitizedNote = normalizeUserNote(sanitizedNote || '', synonyms);
    sanitizedNote = sanitizeNoteForStorage(sanitizedNote);

    await logEvent(userId, 'note_entered', {
      note_length: sanitizedNote.length,
      meal_type: mealType,
    });
  }

  const analysisResponse = await analyzePhotoWithVision({
    photoUri,
    userContext: {
      region: userRegion,
      dietaryPrefs,
      auxText: sanitizedNote,
    },
  });

  const mappedFoods = await Promise.all(
    analysisResponse.items.map(async (item) => {
      const mapped = await mapDetectedFoodToDatabase(item.name, userRegion);
      return {
        ...item,
        foodId: mapped?.id,
        name: mapped?.name || item.name,
        calories: mapped?.calories || item.calories,
        protein: mapped?.protein || item.protein,
        carbs: mapped?.carbs || item.carbs,
        fat: mapped?.fat || item.fat,
      };
    })
  );

  const userPriors = await getUserPortionPriors(userId);

  let adjustedFoods = mappedFoods.map((food) => {
    const priorResult = applyUserPriors(food, userPriors);
    return priorResult.adjusted ? priorResult.food : food;
  });

  if (sanitizedNote) {
    adjustedFoods = await Promise.all(
      adjustedFoods.map(async (food) => {
        const presetResult = await applyPresetToPortion(
          food.name,
          food.portion,
          sanitizedNote,
          userRegion
        );

        if (presetResult.wasAdjusted) {
          const ratio = presetResult.adjustedPortion / food.portion;
          return {
            ...food,
            portion: presetResult.adjustedPortion,
            calories: Math.round(food.calories * ratio),
            protein: Math.round(food.protein * ratio * 10) / 10,
            carbs: Math.round(food.carbs * ratio * 10) / 10,
            fat: Math.round(food.fat * ratio * 10) / 10,
          };
        }
        return food;
      })
    );
  }

  const conflicts: any[] = [];
  if (sanitizedNote) {
    const contradiction = detectContradictoryNote(adjustedFoods, sanitizedNote);
    if (contradiction?.isContradictory) {
      conflicts.push(contradiction);
      noteConflict = true;

      await logEvent(userId, 'note_conflict_detected', {
        model_item: contradiction.modelItem,
        note_item: contradiction.noteItem,
        confidence: contradiction.confidence,
      });
    }
  }

  const totalCalories = adjustedFoods.reduce((sum, food) => sum + food.calories, 0);
  const avgConfidence =
    adjustedFoods.reduce((sum, food) => sum + food.confidence, 0) / adjustedFoods.length;

  const { data: photoAnalysis, error: insertError } = await supabase
    .from('photo_analyses')
    .insert({
      user_id: userId,
      photo_url: photoUri,
      model_version: 'gpt-4-vision-preview',
      user_note: sanitizedNote || null,
      note_used: !!sanitizedNote,
      note_conflict: noteConflict,
      note_influence_summary: sanitizedNote
        ? `Note provided: "${sanitizedNote}". Used for portion refinement.`
        : null,
      raw_response: analysisResponse,
      parsed_output: {
        items: adjustedFoods,
        total_calories: totalCalories,
        meal_type: mealType,
      },
      overall_confidence: avgConfidence,
      status: 'completed',
    })
    .select()
    .single();

  if (insertError || !photoAnalysis) {
    throw new Error('Failed to save analysis to database');
  }

  if (sanitizedNote) {
    await logEvent(userId, 'note_used_in_analysis', {
      analysis_id: photoAnalysis.id,
      note: sanitizedNote,
      items_count: adjustedFoods.length,
    });
  }

  return {
    analysisId: photoAnalysis.id,
    foods: adjustedFoods,
    totalCalories,
    overallConfidence: avgConfidence,
    usedNote: !!sanitizedNote,
    noteConflict,
    conflicts,
    warnings,
  };
}

export async function runTextOnlyAnalysis(options: AnalysisOptions): Promise<AnalysisResult> {
  const { userNote, mealType = 'lunch', userId, userRegion, dietaryPrefs } = options;

  if (!userNote) {
    throw new Error('User note is required for text-only analysis');
  }

  const validation = validateNoteLength(userNote, 140);
  const sanitizedNote = validation.isValid ? userNote : validation.trimmedNote!;

  const synonyms = await loadSynonyms();
  const normalizedNote = normalizeUserNote(sanitizedNote, synonyms);
  const cleanNote = sanitizeNoteForStorage(normalizedNote);

  const analysisResponse = await analyzeTextOnly(cleanNote, {
    region: userRegion,
    dietaryPrefs,
  });

  const mappedFoods = await Promise.all(
    analysisResponse.items.map(async (item) => {
      const mapped = await mapDetectedFoodToDatabase(item.name, userRegion);
      return {
        ...item,
        foodId: mapped?.id,
        name: mapped?.name || item.name,
        calories: mapped?.calories || item.calories,
        protein: mapped?.protein || item.protein,
        carbs: mapped?.carbs || item.carbs,
        fat: mapped?.fat || item.fat,
      };
    })
  );

  const totalCalories = mappedFoods.reduce((sum, food) => sum + food.calories, 0);
  const avgConfidence =
    mappedFoods.reduce((sum, food) => sum + food.confidence, 0) / mappedFoods.length;

  const { data: photoAnalysis, error: insertError } = await supabase
    .from('photo_analyses')
    .insert({
      user_id: userId,
      photo_url: null,
      model_version: 'gpt-4-text',
      user_note: cleanNote,
      note_used: true,
      note_conflict: false,
      raw_response: analysisResponse,
      parsed_output: {
        items: mappedFoods,
        total_calories: totalCalories,
        meal_type: mealType,
      },
      overall_confidence: avgConfidence,
      status: 'completed',
    })
    .select()
    .single();

  if (insertError || !photoAnalysis) {
    throw new Error('Failed to save analysis to database');
  }

  return {
    analysisId: photoAnalysis.id,
    foods: mappedFoods,
    totalCalories,
    overallConfidence: avgConfidence,
    usedNote: true,
    noteConflict: false,
    conflicts: [],
    warnings: validation.isValid ? [] : [validation.warning!],
  };
}

export async function saveMealFromAnalysis(
  analysisId: string,
  userId: string,
  editedFoods: DetectedFood[],
  mealType: string,
  timestamp: Date = new Date()
): Promise<string> {
  const totalCalories = editedFoods.reduce((sum, food) => sum + food.calories, 0);
  const totalProtein = editedFoods.reduce((sum, food) => sum + food.protein, 0);
  const totalCarbs = editedFoods.reduce((sum, food) => sum + food.carbs, 0);
  const totalFat = editedFoods.reduce((sum, food) => sum + food.fat, 0);

  const { data: analysis } = await supabase
    .from('photo_analyses')
    .select('user_note, photo_url')
    .eq('id', analysisId)
    .single();

  const { data: mealLog, error: mealError } = await supabase
    .from('meal_logs')
    .insert({
      user_id: userId,
      meal_type: mealType,
      logged_at: timestamp.toISOString(),
      source: analysis?.photo_url ? 'photo' : 'text',
      photo_analysis_id: analysisId,
      context_note: analysis?.user_note || null,
      total_calories: totalCalories,
      protein_grams: totalProtein,
      carbs_grams: totalCarbs,
      fat_grams: totalFat,
    })
    .select()
    .single();

  if (mealError || !mealLog) {
    throw new Error('Failed to save meal log');
  }

  const mealItems = editedFoods.map((food) => ({
    meal_log_id: mealLog.id,
    food_id: food.foodId || null,
    food_name: food.name,
    portion_grams: food.portion,
    calories: food.calories,
    protein_grams: food.protein,
    carbs_grams: food.carbs,
    fat_grams: food.fat,
    confidence: food.confidence,
  }));

  const { error: itemsError } = await supabase.from('meal_items').insert(mealItems);

  if (itemsError) {
    throw new Error('Failed to save meal items');
  }

  await supabase
    .from('photo_analyses')
    .update({ status: 'saved' })
    .eq('id', analysisId);

  await logEvent(userId, 'meal_saved_from_analysis', {
    analysis_id: analysisId,
    meal_log_id: mealLog.id,
    items_count: editedFoods.length,
    total_calories: totalCalories,
  });

  return mealLog.id;
}

export async function getAnalysisById(analysisId: string): Promise<AnalysisResult | null> {
  const { data, error } = await supabase
    .from('photo_analyses')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error || !data) {
    return null;
  }

  const parsedOutput = data.parsed_output as any;

  return {
    analysisId: data.id,
    foods: parsedOutput.items || [],
    totalCalories: parsedOutput.total_calories || 0,
    overallConfidence: data.overall_confidence || 0,
    usedNote: data.note_used || false,
    noteConflict: data.note_conflict || false,
    conflicts: [],
    warnings: [],
  };
}
