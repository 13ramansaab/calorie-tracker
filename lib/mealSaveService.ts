import { supabase } from '@/lib/supabase';
import { logError, trackPerformance } from './errorTracking';
import * as Crypto from 'expo-crypto';

export interface MealSaveRequest {
  userId: string;
  mealType: string;
  photoUrl?: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  loggedAt?: Date;
  items?: MealItemRequest[];
}

export interface MealItemRequest {
  foodName: string;
  portionGrams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface MealSaveResult {
  mealId: string;
  isDuplicate: boolean;
  items: any[];
}

/**
 * Generate idempotency key from meal data
 * Ensures same meal data always produces same key
 */
export function generateIdempotencyKey(request: MealSaveRequest): string {
  const normalized = {
    userId: request.userId,
    mealType: request.mealType,
    photoUrl: request.photoUrl || '',
    totalCalories: Math.round(request.totalCalories),
    totalProtein: Math.round(request.totalProtein),
    totalCarbs: Math.round(request.totalCarbs),
    totalFat: Math.round(request.totalFat),
    timestamp: request.loggedAt
      ? Math.floor(request.loggedAt.getTime() / 60000) * 60000
      : Math.floor(Date.now() / 60000) * 60000,
  };

  const dataString = JSON.stringify(normalized);

  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dataString).then(
    (hash) => hash
  );
}

/**
 * Idempotent meal save - safe for client retries
 * Uses idempotency key to prevent duplicate saves
 */
export async function saveMealIdempotent(
  request: MealSaveRequest
): Promise<MealSaveResult> {
  const startTime = Date.now();
  let mealId: string | undefined;

  try {
    const idempotencyKey = await generateIdempotencyKey(request);

    const { data, error } = await supabase.rpc('save_meal_idempotent', {
      p_user_id: request.userId,
      p_idempotency_key: idempotencyKey,
      p_meal_type: request.mealType,
      p_photo_url: request.photoUrl || null,
      p_total_calories: request.totalCalories,
      p_total_protein: request.totalProtein,
      p_total_carbs: request.totalCarbs,
      p_total_fat: request.totalFat,
      p_logged_at: request.loggedAt?.toISOString() || new Date().toISOString(),
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error('No result returned from save operation');
    }

    const result = data[0];
    mealId = result.meal_id;
    const isDuplicate = result.is_duplicate;

    if (isDuplicate) {
      const { data: existingItems } = await supabase
        .from('meal_log_items')
        .select('*')
        .eq('meal_log_id', mealId);

      await trackPerformance(
        request.userId,
        'meal_save_idempotent',
        Date.now() - startTime,
        true
      );

      return {
        mealId,
        isDuplicate: true,
        items: existingItems || [],
      };
    }

    const savedItems = [];
    if (request.items && request.items.length > 0) {
      const itemsToInsert = request.items.map((item) => ({
        meal_log_id: mealId,
        food_name: item.foodName,
        portion_grams: item.portionGrams,
        calories: item.calories,
        protein_grams: item.proteinGrams,
        carbs_grams: item.carbsGrams,
        fat_grams: item.fatGrams,
      }));

      const { data: items, error: itemsError } = await supabase
        .from('meal_log_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Error saving meal items:', itemsError);
      } else {
        savedItems.push(...(items || []));
      }
    }

    await trackPerformance(
      request.userId,
      'meal_save_idempotent',
      Date.now() - startTime,
      true
    );

    return {
      mealId,
      isDuplicate: false,
      items: savedItems,
    };
  } catch (error) {
    await logError('system', error as Error, {
      userId: request.userId,
      operation: 'meal_save',
      metadata: { mealId },
    });

    await trackPerformance(
      request.userId,
      'meal_save_idempotent',
      Date.now() - startTime,
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );

    throw error;
  }
}

/**
 * Retry-safe meal update
 * Updates existing meal without creating duplicates
 */
export async function updateMealSafe(
  mealId: string,
  userId: string,
  updates: Partial<MealSaveRequest>
): Promise<void> {
  try {
    const updateData: any = {};

    if (updates.mealType) updateData.meal_type = updates.mealType;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
    if (updates.totalCalories !== undefined)
      updateData.total_calories = updates.totalCalories;
    if (updates.totalProtein !== undefined) updateData.total_protein = updates.totalProtein;
    if (updates.totalCarbs !== undefined) updateData.total_carbs = updates.totalCarbs;
    if (updates.totalFat !== undefined) updateData.total_fat = updates.totalFat;
    if (updates.loggedAt) updateData.logged_at = updates.loggedAt.toISOString();

    const { error } = await supabase
      .from('meal_logs')
      .update(updateData)
      .eq('id', mealId)
      .eq('user_id', userId);

    if (error) throw error;

    if (updates.items && updates.items.length > 0) {
      await supabase.from('meal_log_items').delete().eq('meal_log_id', mealId);

      const itemsToInsert = updates.items.map((item) => ({
        meal_log_id: mealId,
        food_name: item.foodName,
        portion_grams: item.portionGrams,
        calories: item.calories,
        protein_grams: item.proteinGrams,
        carbs_grams: item.carbsGrams,
        fat_grams: item.fatGrams,
      }));

      const { error: itemsError } = await supabase
        .from('meal_log_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
    }
  } catch (error) {
    await logError('system', error as Error, {
      userId,
      operation: 'meal_update',
      metadata: { mealId },
    });

    throw error;
  }
}

/**
 * Delete meal safely
 */
export async function deleteMealSafe(mealId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('meal_logs')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    await logError('system', error as Error, {
      userId,
      operation: 'meal_delete',
      metadata: { mealId },
    });

    throw error;
  }
}
