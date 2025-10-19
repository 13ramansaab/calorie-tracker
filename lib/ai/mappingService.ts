import { supabase } from '@/lib/supabase';
import { DetectedFood } from '@/types/ai';
import { INDIAN_SYNONYM_MAP, INDIAN_PORTION_PRIORS } from './prompts';

interface FoodItem {
  id: string;
  name: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  category?: string;
  tags?: string[];
}

interface MappingResult {
  foodItemId?: string;
  confidence: number;
  name: string;
  portion: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export async function mapDetectedFoodToDatabase(
  detectedFood: DetectedFood,
  userRegion?: string,
  dietaryPrefs?: string[]
): Promise<MappingResult> {
  const normalizedName = normalizeFoodName(detectedFood.name);

  const matchedFood = await fuzzySearchFoodItem(
    normalizedName,
    userRegion,
    dietaryPrefs
  );

  if (matchedFood) {
    const portionInGrams = convertToGrams(detectedFood.portion, detectedFood.unit);
    const multiplier = portionInGrams / 100;

    return {
      foodItemId: matchedFood.id,
      confidence: calculateMappingConfidence(detectedFood.name, matchedFood.name),
      name: matchedFood.name,
      portion: portionInGrams,
      calories: Math.round(matchedFood.calories_per_100g * multiplier),
      protein: Math.round(matchedFood.protein_per_100g * multiplier * 10) / 10,
      carbs: Math.round(matchedFood.carbs_per_100g * multiplier * 10) / 10,
      fat: Math.round(matchedFood.fat_per_100g * multiplier * 10) / 10,
    };
  }

  return {
    confidence: 40,
    name: detectedFood.name,
    portion: convertToGrams(detectedFood.portion, detectedFood.unit),
    calories: detectedFood.calories,
    protein: detectedFood.protein,
    carbs: detectedFood.carbs,
    fat: detectedFood.fat,
  };
}

function normalizeFoodName(name: string): string {
  let normalized = name.toLowerCase().trim();

  Object.entries(INDIAN_SYNONYM_MAP).forEach(([synonym, canonical]) => {
    if (normalized.includes(synonym)) {
      normalized = canonical;
    }
  });

  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
}

async function fuzzySearchFoodItem(
  searchTerm: string,
  userRegion?: string,
  dietaryPrefs?: string[]
): Promise<FoodItem | null> {
  try {
    let query = supabase
      .from('food_items')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .limit(10);

    if (userRegion) {
      query = query.contains('tags', [userRegion.toLowerCase()]);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    let matches = data;

    if (dietaryPrefs && dietaryPrefs.length > 0) {
      matches = data.filter((item) => {
        if (!item.tags) return true;
        return dietaryPrefs.every((pref) =>
          item.tags!.some((tag: string) => tag.toLowerCase().includes(pref.toLowerCase()))
        );
      });
    }

    if (matches.length === 0) {
      matches = data;
    }

    const exactMatch = matches.find(
      (item) => item.name.toLowerCase() === searchTerm.toLowerCase()
    );

    if (exactMatch) return exactMatch;

    return matches.sort((a, b) => {
      const scoreA = calculateMatchScore(searchTerm, a.name);
      const scoreB = calculateMatchScore(searchTerm, b.name);
      return scoreB - scoreA;
    })[0];
  } catch (error) {
    console.error('Error searching food items:', error);
    return null;
  }
}

function calculateMatchScore(search: string, name: string): number {
  const searchLower = search.toLowerCase();
  const nameLower = name.toLowerCase();

  if (nameLower === searchLower) return 100;
  if (nameLower.includes(searchLower)) return 80;

  const searchWords = searchLower.split(' ');
  const nameWords = nameLower.split(' ');

  const matchingWords = searchWords.filter((word) =>
    nameWords.some((nw) => nw.includes(word) || word.includes(nw))
  );

  return (matchingWords.length / searchWords.length) * 60;
}

function calculateMappingConfidence(detectedName: string, dbName: string): number {
  const score = calculateMatchScore(detectedName, dbName);

  if (score >= 90) return 95;
  if (score >= 70) return 85;
  if (score >= 50) return 70;
  return 60;
}

function convertToGrams(value: number, unit: string): number {
  const unitLower = unit.toLowerCase();

  const conversionMap: Record<string, number> = {
    g: 1,
    kg: 1000,
    mg: 0.001,
    ml: 1,
    l: 1000,
    cup: 240,
    tbsp: 15,
    tsp: 5,
    oz: 28.35,
    lb: 453.59,
  };

  return Math.round(value * (conversionMap[unitLower] || 1));
}

export async function resolvePortionFromPriors(
  foodName: string,
  detectedPortion: number
): Promise<number> {
  const normalizedName = normalizeFoodName(foodName);

  const prior = INDIAN_PORTION_PRIORS[normalizedName];
  if (prior && Math.abs(detectedPortion - prior) / prior > 0.5) {
    return prior;
  }

  return detectedPortion;
}

export async function createCustomFoodItem(
  detectedFood: DetectedFood,
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('food_items')
    .insert({
      name: detectedFood.name,
      calories_per_100g: (detectedFood.calories / detectedFood.portion) * 100,
      protein_per_100g: (detectedFood.protein / detectedFood.portion) * 100,
      carbs_per_100g: (detectedFood.carbs / detectedFood.portion) * 100,
      fat_per_100g: (detectedFood.fat / detectedFood.portion) * 100,
      category: 'custom',
      tags: ['user-created'],
      created_by: userId,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to create custom food item');
  }

  return data.id;
}
