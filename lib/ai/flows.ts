import { supabase } from '@/lib/supabase';
import { analyzePhotoWithVision } from './visionService';
import { analyzeTextDescription } from './textService';
import { mapDetectedFoodToDatabase } from './mappingService';
import {
  calculateOverallConfidence,
  calculatePortionHeuristic,
} from './confidenceOrchestrator';
import { checkUsageLimit, incrementUsage } from './usageLimits';
import { AnalysisResponse, DetectedFood } from '@/types/ai';

interface VisionAnalyzePhotoInput {
  image_url: string;
  user_id: string;
  meal_context?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  region?: string;
  dietary_prefs?: string[];
}

interface VisionAnalyzePhotoOutput {
  items: DetectedFood[];
  total_kcal: number;
  confidence: number;
  explanation?: string;
  modelVersion: string;
  latency_ms: number;
  analysis_id: string;
}

export async function vision_analyze_photo(
  input: VisionAnalyzePhotoInput
): Promise<VisionAnalyzePhotoOutput> {
  const startTime = Date.now();

  try {
    const analysisResult = await analyzePhotoWithVision({
      type: 'photo',
      photoUri: input.image_url,
      mealType: input.meal_context,
      userContext: {
        region: input.region,
        dietaryPrefs: input.dietary_prefs,
      },
    });

    const mappedItems = await Promise.all(
      analysisResult.foods.map(async (food) => {
        const mapped = await mapDetectedFoodToDatabase(
          food,
          input.region,
          input.dietary_prefs
        );

        const portionHeuristic = calculatePortionHeuristic(
          mapped.portion,
          food.portion
        );

        const overallConfidence = calculateOverallConfidence(
          food,
          mapped.confidence,
          portionHeuristic,
          !!input.region
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

    const latency_ms = Date.now() - startTime;

    const { data: photoAnalysis, error } = await supabase
      .from('photo_analyses')
      .insert({
        user_id: input.user_id,
        image_url: input.image_url,
        source: 'camera',
        detected_dishes: mappedItems,
        overall_confidence: analysisResult.overallConfidence / 100,
        model_version: analysisResult.modelVersion,
        raw_response: analysisResult,
        latency_ms,
        status: 'analyzed',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating photo analysis:', error);
    }

    await incrementUsage(input.user_id, 'photo');

    return {
      items: mappedItems,
      total_kcal: analysisResult.totalCalories,
      confidence: analysisResult.overallConfidence,
      explanation: analysisResult.notes,
      modelVersion: analysisResult.modelVersion,
      latency_ms,
      analysis_id: photoAnalysis?.id || '',
    };
  } catch (error) {
    console.error('Vision analysis flow error:', error);
    throw error;
  }
}

interface TextAnalyzeDescriptionInput {
  text: string;
  user_id: string;
  context?: {
    meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    region?: string;
    dietary_prefs?: string[];
  };
}

export async function text_analyze_description(
  input: TextAnalyzeDescriptionInput
): Promise<VisionAnalyzePhotoOutput> {
  const startTime = Date.now();

  try {
    const analysisResult = await analyzeTextDescription({
      type: 'text',
      text: input.text,
      mealType: input.context?.meal_type,
      userContext: {
        region: input.context?.region,
        dietaryPrefs: input.context?.dietary_prefs,
      },
    });

    const mappedItems = await Promise.all(
      analysisResult.foods.map(async (food) => {
        const mapped = await mapDetectedFoodToDatabase(
          food,
          input.context?.region,
          input.context?.dietary_prefs
        );

        const portionHeuristic = calculatePortionHeuristic(
          mapped.portion,
          food.portion
        );

        const overallConfidence = calculateOverallConfidence(
          food,
          mapped.confidence,
          portionHeuristic,
          !!input.context?.region
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

    const latency_ms = Date.now() - startTime;

    const { data: textAnalysis, error } = await supabase
      .from('photo_analyses')
      .insert({
        user_id: input.user_id,
        image_url: '',
        source: 'camera',
        detected_dishes: mappedItems,
        overall_confidence: analysisResult.overallConfidence / 100,
        model_version: analysisResult.modelVersion,
        raw_response: analysisResult,
        latency_ms,
        status: 'analyzed',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating text analysis:', error);
    }

    await incrementUsage(input.user_id, 'text');

    return {
      items: mappedItems,
      total_kcal: analysisResult.totalCalories,
      confidence: analysisResult.overallConfidence,
      explanation: analysisResult.notes,
      modelVersion: analysisResult.modelVersion,
      latency_ms,
      analysis_id: textAnalysis?.id || '',
    };
  } catch (error) {
    console.error('Text analysis flow error:', error);
    throw error;
  }
}

interface FoodItemSuggestion {
  foodItemId: string;
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface ResolvedFoodItem {
  foodItemId?: string;
  name: string;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mapping_conf: number;
  suggestions: FoodItemSuggestion[];
}

export async function resolve_food_items(
  items: DetectedFood[],
  region?: string,
  dietaryPrefs?: string[]
): Promise<ResolvedFoodItem[]> {
  const resolved = await Promise.all(
    items.map(async (item) => {
      const mapped = await mapDetectedFoodToDatabase(item, region, dietaryPrefs);

      const suggestions: FoodItemSuggestion[] = [];

      if (mapped.confidence < 85) {
        const { data: similarFoods } = await supabase
          .from('food_items')
          .select('*')
          .ilike('name', `%${item.name.split(' ')[0]}%`)
          .limit(3);

        if (similarFoods) {
          suggestions.push(
            ...similarFoods.map((food) => ({
              foodItemId: food.id,
              name: food.name,
              confidence: 80,
              calories: Math.round(
                (food.calories_per_100g * item.portion) / 100
              ),
              protein: Math.round(
                (food.protein_per_100g * item.portion) / 100
              ),
              carbs: Math.round((food.carbs_per_100g * item.portion) / 100),
              fat: Math.round((food.fat_per_100g * item.portion) / 100),
            }))
          );
        }
      }

      return {
        foodItemId: mapped.foodItemId,
        name: mapped.name,
        portion: mapped.portion,
        calories: mapped.calories,
        protein: mapped.protein,
        carbs: mapped.carbs,
        fat: mapped.fat,
        mapping_conf: mapped.confidence,
        suggestions,
      };
    })
  );

  return resolved;
}

interface SaveMealFromAnalysisInput {
  user_id: string;
  items: DetectedFood[];
  timestamp: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  photo_url?: string;
  analysis_id?: string;
  notes?: string;
}

export async function save_meal_from_analysis(
  input: SaveMealFromAnalysisInput
): Promise<{ meal_log_id: string; success: boolean }> {
  try {
    const totals = input.items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const { data: mealLog, error: mealError } = await supabase
      .from('meal_logs')
      .insert({
        user_id: input.user_id,
        meal_type: input.mealType,
        logged_at: input.timestamp.toISOString(),
        source: input.photo_url ? 'photo' : 'ai',
        photo_url: input.photo_url,
        photo_analysis_id: input.analysis_id,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fat: totals.fat,
        notes: input.notes,
      })
      .select()
      .single();

    if (mealError) throw mealError;

    const mealLogItems = input.items.map((item) => ({
      meal_log_id: mealLog.id,
      food_name: item.name,
      portion_grams: item.portion,
      calories: item.calories,
      protein_grams: item.protein,
      carbs_grams: item.carbs,
      fat_grams: item.fat,
      confidence_score: item.confidence / 100,
      name_snapshot: item.name,
    }));

    const { error: itemsError } = await supabase
      .from('meal_log_items')
      .insert(mealLogItems);

    if (itemsError) throw itemsError;

    if (input.analysis_id) {
      await supabase
        .from('photo_analyses')
        .update({ status: 'confirmed' })
        .eq('id', input.analysis_id);
    }

    return {
      meal_log_id: mealLog.id,
      success: true,
    };
  } catch (error) {
    console.error('Save meal from analysis error:', error);
    throw error;
  }
}

interface QuotaCheckResult {
  allow: boolean;
  reason?: string;
  remaining: number;
  limit: number;
}

export async function enforce_quota_or_paywall(
  user_id: string,
  feature_key: 'photo_analysis' | 'text_analysis' | 'ai_chat'
): Promise<QuotaCheckResult> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .maybeSingle();

    const isPremium =
      subscription &&
      (subscription.plan === 'premium_monthly' ||
        subscription.plan === 'premium_yearly' ||
        subscription.plan === 'trial');

    if (isPremium) {
      const isTrialValid =
        subscription.plan !== 'trial' ||
        !subscription.trial_end_date ||
        new Date(subscription.trial_end_date) > new Date();

      if (isTrialValid) {
        return {
          allow: true,
          remaining: -1,
          limit: -1,
        };
      }
    }

    const featureTypeMap = {
      photo_analysis: 'photo' as const,
      text_analysis: 'text' as const,
      ai_chat: 'text' as const,
    };

    const usageType = featureTypeMap[feature_key];

    const usageCheck = await checkUsageLimit(user_id, usageType, 'free');

    if (!usageCheck.allowed) {
      return {
        allow: false,
        reason: `Daily limit reached for ${feature_key}. Upgrade to Premium for unlimited access.`,
        remaining: usageCheck.remaining,
        limit: usageCheck.limit.photoAnalysesPerDay,
      };
    }

    return {
      allow: true,
      remaining: usageCheck.remaining,
      limit: usageCheck.limit.photoAnalysesPerDay,
    };
  } catch (error) {
    console.error('Quota enforcement error:', error);
    return {
      allow: false,
      reason: 'Error checking quota',
      remaining: 0,
      limit: 0,
    };
  }
}
