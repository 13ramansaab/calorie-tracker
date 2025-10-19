import { AnalysisResponse, AnalysisInput, DetectedFood } from '@/types/ai';
import {
  SYSTEM_PROMPT,
  TEXT_PROMPT_TEMPLATE,
  buildPromptConfig,
} from './prompts';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const MODEL_VERSION = 'gpt-4-turbo-preview';

export async function analyzeTextDescription(
  input: AnalysisInput
): Promise<AnalysisResponse> {
  if (!input.text) {
    throw new Error('Text is required for text analysis');
  }

  try {
    const contextPrompt = buildPromptConfig(
      input.userContext?.region,
      input.userContext?.dietaryPrefs,
      input.userContext?.recentFoods
    );

    const userPrompt = TEXT_PROMPT_TEMPLATE(input.text, input.mealType);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_VERSION,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT + contextPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const parsedResult = JSON.parse(content);
    return formatAnalysisResponse(parsedResult, MODEL_VERSION);
  } catch (error) {
    console.error('Text analysis error:', error);
    return createFallbackResponse(input.text || '', error);
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
    confidence: food.confidence || 60,
    noteInfluence: 'none',
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

function createFallbackResponse(text: string, error: any): AnalysisResponse {
  const estimatedCalories = text.length > 50 ? 400 : 250;

  return {
    foods: [
      {
        name: text.substring(0, 50) || 'Unknown Food',
        portion: 100,
        unit: 'g',
        calories: estimatedCalories,
        protein: Math.round(estimatedCalories * 0.15 / 4),
        carbs: Math.round(estimatedCalories * 0.5 / 4),
        fat: Math.round(estimatedCalories * 0.35 / 9),
        confidence: 30,
        noteInfluence: 'none',
      },
    ],
    totalCalories: estimatedCalories,
    totalProtein: Math.round(estimatedCalories * 0.15 / 4),
    totalCarbs: Math.round(estimatedCalories * 0.5 / 4),
    totalFat: Math.round(estimatedCalories * 0.35 / 9),
    overallConfidence: 30,
    modelVersion: MODEL_VERSION,
    timestamp: new Date().toISOString(),
    notes: `Analysis failed: ${error.message}. Please edit manually.`,
  };
}

export function extractFoodEntities(text: string): string[] {
  const commonFoods = [
    'roti',
    'rice',
    'dal',
    'chicken',
    'paneer',
    'dosa',
    'idli',
    'biryani',
    'curry',
    'paratha',
  ];

  const lowerText = text.toLowerCase();
  return commonFoods.filter((food) => lowerText.includes(food));
}

export function normalizeUnits(
  value: number,
  unit: string
): { value: number; unit: string } {
  const unitMap: Record<string, { factor: number; target: string }> = {
    kg: { factor: 1000, target: 'g' },
    lb: { factor: 453.592, target: 'g' },
    oz: { factor: 28.3495, target: 'g' },
    l: { factor: 1000, target: 'ml' },
    cup: { factor: 240, target: 'ml' },
    tbsp: { factor: 15, target: 'ml' },
    tsp: { factor: 5, target: 'ml' },
  };

  const lowerUnit = unit.toLowerCase();
  if (unitMap[lowerUnit]) {
    return {
      value: value * unitMap[lowerUnit].factor,
      unit: unitMap[lowerUnit].target,
    };
  }

  return { value, unit };
}
