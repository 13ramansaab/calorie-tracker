import { AnalysisResponse, AnalysisInput, DetectedFood } from '@/types/ai';
import {
  SYSTEM_PROMPT,
  VISION_PROMPT_TEMPLATE,
  buildPromptConfig,
} from './prompts';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const MODEL_VERSION = 'gpt-4-vision-preview';

export async function analyzePhotoWithVision(
  input: AnalysisInput
): Promise<AnalysisResponse> {
  if (!input.photoUri) {
    throw new Error('Photo URI is required for vision analysis');
  }

  try {
    const base64Image = await convertImageToBase64(input.photoUri);

    const contextPrompt = buildPromptConfig(
      input.userContext?.region,
      input.userContext?.dietaryPrefs,
      input.userContext?.recentFoods
    );

    const userPrompt = VISION_PROMPT_TEMPLATE(input.mealType, input.userContext?.region);

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
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.3,
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

    const parsedResult = parseAIResponse(content);
    return formatAnalysisResponse(parsedResult, MODEL_VERSION);
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
