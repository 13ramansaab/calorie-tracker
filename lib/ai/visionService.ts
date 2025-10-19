import { AnalysisResponse, AnalysisInput, DetectedFood } from '@/types/ai';
import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const MODEL_VERSION = 'gpt-4o';

export async function analyzePhotoWithVision(
  input: AnalysisInput
): Promise<AnalysisResponse> {
  if (!input.photoUri) {
    throw new Error('Photo URI is required for vision analysis');
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(input.photoUri, {
      encoding: 'base64',
    });

    const arrayBuffer = decode(base64);

    const fileName = `food-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('food-photos')
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('food-photos')
      .getPublicUrl(fileName);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    const functionResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze-photo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'Apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        image_url: publicUrl,
        user_id: session.user.id,
        meal_type: input.mealType,
      }),
    });

    if (!functionResponse.ok) {
      const error = await functionResponse.json();
      throw new Error(`Vision analysis error: ${error.message || 'Unknown error'}`);
    }

    const data = await functionResponse.json();
    console.log('🔥 DEBUG FULL RESPONSE:', JSON.stringify(data, null, 2));

    if (data.error) {
      throw new Error(data.message || data.error);
    }

    return formatAnalysisResponse(data, MODEL_VERSION);
  } catch (error) {
    console.error('Vision analysis error:', error);
    return createFallbackResponse(error);
  }
}

function formatAnalysisResponse(
  parsed: any,
  modelVersion: string
): AnalysisResponse {
  // 🔥 FIXED: Use 'items' as fallback if 'foods' missing
  const foodsArray = parsed.foods || parsed.items || [];
  
  const foods: DetectedFood[] = foodsArray.map((food: any) => ({
    name: food.name || 'Unknown Food',
    portion: food.portion || 100,
    unit: food.unit || 'g',
    calories: food.calories || 0,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
    confidence: food.confidence || 50,
    noteInfluence: 'none',  // 🔥 FIXED: HARDCODED
  }));

  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return {
    foods,
    totalCalories: Math.round(totals.calories),
    totalProtein: Math.round(totals.protein),
    totalCarbs: Math.round(totals.carbs),
    totalFat: Math.round(totals.fat),
    overallConfidence: foods.length > 0 ? 85 : 0,
    modelVersion,
    timestamp: new Date().toISOString(),
    notes: parsed.explanation || parsed.notes,
  };
}

function createFallbackResponse(error: any): AnalysisResponse {
  return {
    foods: [{
      name: 'Unknown Food',
      portion: 100,
      unit: 'g',
      calories: 200,
      protein: 5,
      carbs: 30,
      fat: 5,
      confidence: 20,
      noteInfluence: 'none',
    }],
    totalCalories: 200,
    totalProtein: 5,
    totalCarbs: 30,
    totalFat: 5,
    overallConfidence: 20,
    modelVersion: MODEL_VERSION,
    timestamp: new Date().toISOString(),
    notes: `Analysis failed: ${error.message}. Please edit manually.`,
  };
}