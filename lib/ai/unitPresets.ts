import { supabase } from '@/lib/supabase';

export interface UnitPreset {
  foodItem: string;
  unitType: string;
  minGrams: number;
  maxGrams: number;
  avgGrams: number;
  region?: string;
  category?: string;
  notes?: string;
}

export async function getUnitPreset(
  foodItem: string,
  unitType: string = 'piece',
  region?: string
): Promise<UnitPreset | null> {
  try {
    const { data, error } = await supabase.rpc('get_unit_preset', {
      p_food_item: foodItem.toLowerCase(),
      p_unit_type: unitType.toLowerCase(),
      p_region: region || null,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    const preset = data[0];
    return {
      foodItem,
      unitType,
      minGrams: preset.min_grams,
      maxGrams: preset.max_grams,
      avgGrams: preset.avg_grams,
      notes: preset.notes,
    };
  } catch (error) {
    console.error('Failed to get unit preset:', error);
    return null;
  }
}

export async function convertToGrams(
  foodItem: string,
  count: number,
  unitType: string = 'piece',
  region?: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase.rpc('convert_to_grams', {
      p_food_item: foodItem.toLowerCase(),
      p_count: count,
      p_unit_type: unitType.toLowerCase(),
      p_region: region || null,
    });

    if (error || data === null) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to convert to grams:', error);
    return null;
  }
}

export async function getAllPresets(
  category?: string
): Promise<UnitPreset[]> {
  try {
    let query = supabase
      .from('unit_presets')
      .select('*')
      .order('food_item');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = query;

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      foodItem: row.food_item,
      unitType: row.unit_type,
      minGrams: row.min_grams,
      maxGrams: row.max_grams,
      avgGrams: row.avg_grams,
      region: row.region,
      category: row.category,
      notes: row.notes,
    }));
  } catch (error) {
    console.error('Failed to get all presets:', error);
    return [];
  }
}

export function extractCountAndUnit(text: string): {
  count: number;
  unit: string;
  foodItem: string;
} | null {
  const patterns = [
    /(\d+)\s+(chapati|roti|paratha|naan|idli|dosa|vada)/i,
    /(\d+)\s+(katori|bowl|cup|plate|glass|spoon)\s+([a-z\s]+)/i,
    /(small|medium|large)\s+(bowl|plate|cup)\s+([a-z\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        return {
          count: parseInt(match[1], 10),
          unit: 'piece',
          foodItem: match[2],
        };
      } else if (pattern === patterns[1]) {
        return {
          count: parseInt(match[1], 10),
          unit: match[2],
          foodItem: match[3].trim(),
        };
      } else if (pattern === patterns[2]) {
        const sizeMultipliers = { small: 0.75, medium: 1.0, large: 1.3 };
        return {
          count: sizeMultipliers[match[1].toLowerCase() as keyof typeof sizeMultipliers] || 1,
          unit: match[2],
          foodItem: match[3].trim(),
        };
      }
    }
  }

  return null;
}

export async function applyPresetToPortion(
  foodItem: string,
  detectedPortion: number,
  userNote?: string,
  region?: string
): Promise<{ adjustedPortion: number; wasAdjusted: boolean; reason?: string }> {
  if (!userNote) {
    return { adjustedPortion: detectedPortion, wasAdjusted: false };
  }

  const extracted = extractCountAndUnit(userNote);
  if (!extracted) {
    return { adjustedPortion: detectedPortion, wasAdjusted: false };
  }

  if (!extracted.foodItem.toLowerCase().includes(foodItem.toLowerCase())) {
    return { adjustedPortion: detectedPortion, wasAdjusted: false };
  }

  const grams = await convertToGrams(
    extracted.foodItem,
    extracted.count,
    extracted.unit,
    region
  );

  if (!grams) {
    return { adjustedPortion: detectedPortion, wasAdjusted: false };
  }

  const deviation = Math.abs(grams - detectedPortion) / detectedPortion;
  if (deviation > 0.5) {
    return {
      adjustedPortion: grams,
      wasAdjusted: true,
      reason: `User note "${extracted.count} ${extracted.foodItem}" converted to ${grams}g using preset`,
    };
  }

  return { adjustedPortion: detectedPortion, wasAdjusted: false };
}

export const UNIT_CATEGORIES = [
  'bread',
  'breakfast',
  'grain',
  'rice',
  'lentils',
  'curry',
  'vegetable',
  'side',
  'condiment',
  'snack',
  'sweet',
  'beverage',
  'protein',
];

export const COMMON_UNITS = [
  'piece',
  'katori',
  'bowl',
  'cup',
  'plate',
  'glass',
  'spoon',
];

export const REGIONS = [
  'North India',
  'South India',
  'East India',
  'West India',
  'All India',
];
