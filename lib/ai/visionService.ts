import { AnalysisResponse, AnalysisInput, DetectedFood } from '@/types/ai';
import {
  SYSTEM_PROMPT,
  VISION_PROMPT_TEMPLATE,
  buildPromptConfig,
} from './prompts';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const MODEL_VERSION = 'gpt-4-vision-preview';

export async function analyzePhotoWithVision(
  input: AnalysisInput
): Promise<AnalysisResponse> {
  if (!input.photoUri) {
    throw new Error('Photo URI is required for vision analysis');
  }

  try {
    const functionUrl = `${SUPABASE_URL}/functions/v1/analyze-photo`;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'Apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        image_url: input.photoUri,
        aux_text: input.userContext?.auxText,
        user_id: session.user.id,
        meal_type: input.mealType,
        user_region: input.userContext?.region,
        dietary_prefs: input.userContext?.dietaryPrefs,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Vision analysis error: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.message || data.error);
    }

    return formatAnalysisResponse(data, MODEL_VERSION);
  } catch (error) {
    console.error('Vision analysis error:', error);
    return createFallbackResponse(error);
  }
}

async function convertImageToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to convert image to base64');
  }
}

function parseAIResponse(content: string): any {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid JSON response from AI');
  }
}

function formatAnalysisResponse(
  parsed: any,
  modelVersion: string
): AnalysisResponse {
  const foods: DetectedFood[] = (parsed.foods || []).map((food: any) => ({
    name: food.name || 'Unknown Food',
    portion: food.portion || 100,
    unit: food.unit || 'g',
    calories: food.calories || 0,
    protein: food.protein || 0,
    carbs: food.carbs || 0,
    fat: food.fat || 0,
    confidence: food.confidence || 50,
    noteInfluence: food.note_influence || 'none',
  }));

  const totals = foods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      confidence: acc.confidence + food.confidence,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: 0 }
  );

  return {
    foods,
    totalCalories: Math.round(totals.calories),
    totalProtein: Math.round(totals.protein),
    totalCarbs: Math.round(totals.carbs),
    totalFat: Math.round(totals.fat),
    overallConfidence: foods.length > 0 ? totals.confidence / foods.length : 0,
    modelVersion,
    timestamp: new Date().toISOString(),
    notes: parsed.notes,
  };
}

function createFallbackResponse(error: any): AnalysisResponse {
  return {
    foods: [
      {
        name: 'Unknown Food',
        portion: 100,
        unit: 'g',
        calories: 200,
        protein: 5,
        carbs: 30,
        fat: 5,
        confidence: 20,
      },
    ],
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
