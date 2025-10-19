import { supabase } from '@/lib/supabase';
import { analyzePhotoWithVision } from './visionService';
import { analyzeTextDescription } from './textService';
import { mapDetectedFoodToDatabase } from './mappingService';
import { loadSynonyms, normalizeUserNote } from './multilingualService';
import { detectContradictoryNote, validateNoteLength, sanitizeNoteForStorage } from './edgeCasePolicies';
import { applyPresetToPortion } from './unitPresets';
import { applyUserPriors, getUserPortionPriors } from './personalizationService';
import { logEvent } from './instrumentation';
import { optimizeImageForAnalysis } from './imageOptimization';
import { retryWithBackoff, retryOnBadJson } from './retryLogic';
import { shouldUseCachedAnalysis, saveCachedAnalysis, computeImageHash } from './analysisCache';
import { logAnalysisEvent } from './monitoring';
import { DetectedFood, AnalysisResponse } from '@/types/ai';

export interface AnalysisOptions {
  photoUri?: string;
  userNote?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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
  wasCached?: boolean;
  latencyMs?: number;
}

export async function runPhotoAnalysis(options: AnalysisOptions): Promise<AnalysisResult> {
  const { photoUri, userNote, mealType = 'lunch', userId, userRegion, dietaryPrefs } = options;

  if (!photoUri) {
    throw new Error('Photo URI is required for photo analysis');
  }

  const startTime = Date.now();
  const warnings: string[] = [];
  let sanitizedNote: string | undefined;
  let noteConflict = false;
  let wasCached = false;

  await logEvent(userId, 'ai_analysis_started', {
    latency_ms: 0,
    note_used: !!userNote,
  });

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

  const cacheCheck = await shouldUseCachedAnalysis(userId, photoUri, sanitizedNote);
  if (cacheCheck.useCache && cacheCheck.cachedAnalysis) {
    wasCached = true;
    const latencyMs = Date.now() - startTime;

    await logEvent(userId, 'cache_hit', {
      latency_ms: latencyMs,
    });

    await logEvent(userId, 'ai_analysis_completed', {
      latency_ms: latencyMs,
      was_cached: true,
    });

    return {
      analysisId: cacheCheck.cachedAnalysis.id,
      foods: cacheCheck.cachedAnalysis.parsed_output.items,
      totalCalories: cacheCheck.cachedAnalysis.parsed_output.total_calories,
      overallConfidence: cacheCheck.cachedAnalysis.overall_confidence,
      usedNote: !!sanitizedNote,
      noteConflict: false,
      conflicts: [],
      warnings: ['Using cached analysis from previous session'],
      wasCached: true,
      latencyMs,
    };
  }

  const optimizedImage = await optimizeImageForAnalysis(photoUri);
  if (optimizedImage.wasOptimized) {
    warnings.push(
      `Image optimized from ${(optimizedImage.originalSize! / 1024 / 1024).toFixed(1)}MB to ${(optimizedImage.sizeBytes / 1024 / 1024).toFixed(1)}MB`
    );
  }

  const analysisResponse = await retryOnBadJson(
    () =>
      retryWithBackoff(
        () =>
          analyzePhotoWithVision({
            type: 'photo',
            photoUri: optimizedImage.uri,
            mealType,
            userContext: {
              region: userRegion,
              dietaryPrefs,
              auxText: sanitizedNote,
            },
          }),
        undefined,
        'Vision Analysis'
      ),
    2
  );

  // 🔥 FIXED: Complete DetectedFood objects with ALL required fields
  const mappedFoods = await Promise.all(
    analysisResponse.foods.map(async (food) => {
      const mapped = await mapDetectedFoodToDatabase(food, userRegion);
      return {
        ...food,
        noteInfluence: 'none' as const,  // 🔥 REQUIRED BY mappingService
        unit: food.unit || 'g',  // 🔥 REQUIRED
        foodId: mapped?.foodItemId,
        name: mapped?.name || food.name || 'Unknown Food',
        calories: mapped?.calories || food.calories || 0,
        protein: mapped?.protein || food.protein || 0,
        carbs: mapped?.carbs || food.carbs || 0,
        fat: mapped?.fat || food.fat || 0,
        portion: mapped?.portion || food.portion || 100,
        confidence: food.confidence || 50,
      };
    })
  );

  const userPriors = await getUserPortionPriors();

  let adjustedFoods = mappedFoods.map((food) => {
    const adjustedPortion = applyUserPriors(food.portion, food.name, userPriors);
    return {
      ...food,
      portion: adjustedPortion,
    };
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

  const latencyMs = Date.now() - startTime;

  console.log('Attempting to save analysis to database...');
  console.log('User ID:', userId);
  console.log('Photo URL:', optimizedImage.uri);
  console.log('Adjusted foods:', adjustedFoods);

  // Check if user exists in profiles table
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !userProfile) {
    console.error('User not found in profiles table:', userError);
    throw new Error(`User ${userId} not found in profiles table`);
  }

  console.log('User profile found:', userProfile);

  // First, let's try a simple insert to test the table
  const insertData = {
    user_id: userId,
    image_url: optimizedImage.uri, // Use image_url instead of photo_url
    photo_url: optimizedImage.uri, // Keep both for compatibility
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
    latency_ms: latencyMs,
    status: 'analyzed', // Use 'analyzed' instead of 'completed' to match the check constraint
  };

  console.log('Insert data:', JSON.stringify(insertData, null, 2));

  const { data: photoAnalysis, error: insertError } = await supabase
    .from('photo_analyses')
    .insert(insertData)
    .select()
    .single();

  if (insertError || !photoAnalysis) {
    console.error('Database insert error:', insertError);
    console.error('Photo analysis data:', photoAnalysis);
    await logEvent(userId, 'ai_analysis_failed', {
      latency_ms: latencyMs,
      error_type: 'database_error',
      error_message: insertError?.message || 'Unknown error',
      error_details: insertError,
    });
    throw new Error(`Failed to save analysis to database: ${insertError?.message || 'Unknown error'}`);
  }

  await saveCachedAnalysis(userId, await computeImageHash(photoUri), photoAnalysis.id);

  await logEvent(userId, 'ai_analysis_completed', {
    latency_ms: latencyMs,
    confidence_avg: avgConfidence,
    items_count: adjustedFoods.length,
    note_used: !!sanitizedNote,
    was_cached: false,
    image_size_mb: optimizedImage.sizeBytes / 1024 / 1024,
  });

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
    wasCached,
    latencyMs,
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

  const analysisResponse = await analyzeTextDescription({
    type: 'text',
    text: cleanNote,
    mealType,
    userContext: {
      region: userRegion,
      dietaryPrefs,
    },
  });

  const mappedFoods = await Promise.all(
    analysisResponse.foods.map(async (item: DetectedFood) => {
      const mapped = await mapDetectedFoodToDatabase(item, userRegion);
      return {
        ...item,
        noteInfluence: 'none' as const,
        unit: item.unit || 'g',
        foodId: mapped?.foodItemId,
        name: mapped?.name || item.name,
        calories: mapped?.calories || item.calories,
        protein: mapped?.protein || item.protein,
        carbs: mapped?.carbs || item.carbs,
        fat: mapped?.fat || item.fat,
        portion: mapped?.portion || item.portion,
      };
    })
  );

  const totalCalories = mappedFoods.reduce((sum: number, food: DetectedFood) => sum + food.calories, 0);
  const avgConfidence =
    mappedFoods.reduce((sum: number, food: DetectedFood) => sum + food.confidence, 0) / mappedFoods.length;

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

  console.log('Attempting to save meal log...');
  console.log('Meal log data:', {
    user_id: userId,
    meal_type: mealType,
    logged_at: timestamp.toISOString(),
    source: analysis?.photo_url ? 'photo' : 'text',
    photo_analysis_id: analysisId,
    context_note: analysis?.user_note || null,
    total_calories: totalCalories,
    total_protein: totalProtein,
    total_carbs: totalCarbs,
    total_fat: totalFat,
  });

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
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
    })
    .select()
    .single();

  if (mealError || !mealLog) {
    console.error('Meal log insert error:', mealError);
    console.error('Meal log data:', mealLog);
    throw new Error('Failed to save meal log');
  }

  console.log('Meal log saved successfully:', mealLog);

  console.log('Original editedFoods data:', JSON.stringify(editedFoods, null, 2));
  
  const mealItems = editedFoods.map((food) => ({
    meal_log_id: mealLog.id,
    food_item_id: food.foodId || null,
    food_name: food.name,
    portion_grams: Math.max(Number(food.portion) || 100, 1), // Ensure minimum 1g
    calories: Math.max(Number(food.calories) || 0, 0),
    protein_grams: Math.max(Number(food.protein) || 0, 0),
    carbs_grams: Math.max(Number(food.carbs) || 0, 0),
    fat_grams: Math.max(Number(food.fat) || 0, 0),
    // Temporarily remove these fields to test
    // confidence_score: food.confidence / 100,
    // name_snapshot: food.name,
  }));

  console.log('Attempting to save meal items...');
  console.log('Meal items data:', JSON.stringify(mealItems, null, 2));
  console.log('Number of items:', mealItems.length);
  console.log('First item sample:', mealItems[0]);

  const { error: itemsError } = await supabase.from('meal_log_items').insert(mealItems);

  if (itemsError) {
    console.error('Meal items insert error:', itemsError);
    console.error('Error code:', itemsError.code);
    console.error('Error message:', itemsError.message);
    console.error('Error details:', itemsError.details);
    console.error('Error hint:', itemsError.hint);
    console.error('Meal items data that failed:', mealItems);
    throw new Error(`Failed to save meal items: ${itemsError.message}`);
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