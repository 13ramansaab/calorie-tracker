import { supabase } from '@/lib/supabase';

export interface UserMealPattern {
  id: string;
  mealCombination: string[];
  frequency: number;
  lastLoggedAt: string;
}

export interface UserPortionPrior {
  foodName: string;
  avgPortionGrams: number;
  sampleCount: number;
}

export interface RepeatMealSuggestion {
  label: string;
  items: string[];
  frequency: number;
  daysAgo: number;
}

export async function getUserMealPatterns(
  limit: number = 5,
  mealType?: string
): Promise<UserMealPattern[]> {
  try {
    let query = supabase
      .from('user_meal_patterns')
      .select('*')
      .order('frequency', { ascending: false })
      .order('last_logged_at', { ascending: false });

    if (mealType) {
      query = query.eq('meal_type', mealType);
    }

    const { data, error } = await query.limit(limit);

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      mealCombination: row.meal_combination as string[],
      frequency: row.frequency,
      lastLoggedAt: row.last_logged_at,
    }));
  } catch (error) {
    console.error('Failed to fetch meal patterns:', error);
    return [];
  }
}

export async function getUserPortionPriors(): Promise<
  Record<string, number>
> {
  try {
    const { data, error } = await supabase
      .from('user_portion_priors')
      .select('food_name, avg_portion_grams')
      .gte('sample_count', 3);

    if (error) throw error;

    const priors: Record<string, number> = {};
    (data || []).forEach((row) => {
      priors[row.food_name.toLowerCase()] = row.avg_portion_grams;
    });

    return priors;
  } catch (error) {
    console.error('Failed to fetch portion priors:', error);
    return {};
  }
}

export async function updateMealPattern(items: string[]): Promise<void> {
  try {
    const normalized = items
      .map((item) => item.toLowerCase().trim())
      .sort();

    await supabase.rpc('upsert_meal_pattern', {
      p_meal_combination: normalized,
    });
  } catch (error) {
    console.error('Failed to update meal pattern:', error);
  }
}

export async function updatePortionPrior(
  foodName: string,
  portionGrams: number
): Promise<void> {
  try {
    await supabase.rpc('update_portion_prior', {
      p_food_name: foodName.toLowerCase(),
      p_portion_grams: portionGrams,
    });
  } catch (error) {
    console.error('Failed to update portion prior:', error);
  }
}

export function buildRepeatMealSuggestions(
  patterns: UserMealPattern[]
): RepeatMealSuggestion[] {
  const now = new Date();

  return patterns
    .filter((p) => p.frequency >= 3)
    .slice(0, 3)
    .map((pattern) => {
      const lastLogged = new Date(pattern.lastLoggedAt);
      const daysAgo = Math.floor(
        (now.getTime() - lastLogged.getTime()) / (1000 * 60 * 60 * 24)
      );

      const label = pattern.mealCombination
        .slice(0, 3)
        .join(' + ');

      return {
        label: `Usually: ${label}`,
        items: pattern.mealCombination,
        frequency: pattern.frequency,
        daysAgo,
      };
    });
}

export async function getMealTimeSuggestions(
  userId: string,
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_priors')
      .select('frequent_breakfast_items, frequent_dinner_items, portion_defaults')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return getDefaultMealSuggestions(mealType);
    }

    if (mealType === 'breakfast' && data.frequent_breakfast_items) {
      return data.frequent_breakfast_items as string[];
    }

    if (mealType === 'dinner' && data.frequent_dinner_items) {
      return data.frequent_dinner_items as string[];
    }

    return getDefaultMealSuggestions(mealType);
  } catch (error) {
    console.error('Error fetching meal time suggestions:', error);
    return getDefaultMealSuggestions(mealType);
  }
}

function getDefaultMealSuggestions(mealType: string): string[] {
  const defaults: Record<string, string[]> = {
    breakfast: ['Poha', 'Paratha', 'Idli', 'Dosa', 'Upma', 'Omelette'],
    lunch: ['Dal', 'Rice', 'Roti', 'Sabzi', 'Curd', 'Salad'],
    dinner: ['Chapati', 'Dal', 'Paneer', 'Chicken', 'Rice', 'Raita'],
    snack: ['Fruits', 'Nuts', 'Biscuits', 'Samosa', 'Tea', 'Coffee'],
  };

  return defaults[mealType] || [];
}

export async function updateUserPriors(userId: string, mealType: string, items: string[]): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('user_priors')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from('user_priors').insert({
        user_id: userId,
        frequent_breakfast_items: mealType === 'breakfast' ? items : [],
        frequent_dinner_items: mealType === 'dinner' ? items : [],
        portion_defaults: {},
      });
      return;
    }

    const update: any = {};

    if (mealType === 'breakfast') {
      const currentItems = (existing.frequent_breakfast_items as string[]) || [];
      const merged = Array.from(new Set([...currentItems, ...items])).slice(0, 10);
      update.frequent_breakfast_items = merged;
    } else if (mealType === 'dinner') {
      const currentItems = (existing.frequent_dinner_items as string[]) || [];
      const merged = Array.from(new Set([...currentItems, ...items])).slice(0, 10);
      update.frequent_dinner_items = merged;
    }

    await supabase
      .from('user_priors')
      .update(update)
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error updating user priors:', error);
  }
}

export async function savePortionDefault(
  userId: string,
  foodName: string,
  portionGrams: number
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('user_priors')
      .select('portion_defaults')
      .eq('user_id', userId)
      .maybeSingle();

    const portionDefaults = (existing?.portion_defaults as Record<string, number>) || {};
    portionDefaults[foodName.toLowerCase()] = portionGrams;

    await supabase
      .from('user_priors')
      .upsert({
        user_id: userId,
        portion_defaults: portionDefaults,
      }, {
        onConflict: 'user_id'
      });
  } catch (error) {
    console.error('Error saving portion default:', error);
  }
}

export function applyUserPriors(
  detectedPortion: number,
  foodName: string,
  userPriors: Record<string, number>
): number {
  if (!foodName || typeof foodName !== 'string') {
    return detectedPortion;
  }

  const userPrior = userPriors[foodName.toLowerCase()];

  if (!userPrior) {
    return detectedPortion;
  }

  const weight = 0.4;
  const adjusted =
    detectedPortion * (1 - weight) + userPrior * weight;

  return Math.round(adjusted);
}

export async function trackMealSave(
  items: Array<{ name: string; portion: number }>
): Promise<void> {
  const itemNames = items.map((item) => item.name);
  await updateMealPattern(itemNames);

  for (const item of items) {
    await updatePortionPrior(item.name, item.portion);
  }
}

export function generateInlineHint(
  foodName: string,
  confidence: number,
  category?: string
): { question: string; options: Array<{ value: number; label: string }> } | null {
  if (confidence >= 0.7) {
    return null;
  }

  const countableItems = [
    'roti',
    'chapati',
    'paratha',
    'idli',
    'dosa',
    'vada',
    'egg',
    'anda',
  ];

  const isCountable = countableItems.some((item) =>
    foodName.toLowerCase().includes(item)
  );

  if (isCountable) {
    return {
      question: `How many ${foodName}?`,
      options: [
        { value: 1, label: '1' },
        { value: 2, label: '2' },
        { value: 3, label: '3' },
        { value: 4, label: '4' },
      ],
    };
  }

  if (category === 'curry' || category === 'dal' || category === 'liquid') {
    return {
      question: `What size ${foodName}?`,
      options: [
        { value: 100, label: 'Small' },
        { value: 150, label: 'Medium' },
        { value: 200, label: 'Large' },
      ],
    };
  }

  return null;
}
