import { supabase } from '@/lib/supabase';
import { CorrectionData, DetectedFood } from '@/types/ai';

export async function storeCorrectionFeedback(
  correction: CorrectionData
): Promise<void> {
  try {
    await supabase.from('ai_corrections').insert({
      analysis_id: correction.analysisId,
      user_id: correction.userId,
      original_name: correction.originalFood.name,
      corrected_name: correction.correctedFood.name,
      original_portion: correction.originalFood.portion,
      corrected_portion: correction.correctedFood.portion,
      original_calories: correction.originalFood.calories,
      corrected_calories: correction.correctedFood.calories,
      correction_type: correction.correctionType,
      created_at: correction.timestamp,
    });
  } catch (error) {
    console.error('Error storing correction:', error);
  }
}

export async function getCommonCorrections(
  userId: string,
  limit: number = 10
): Promise<
  Array<{
    original: string;
    corrected: string;
    count: number;
  }>
> {
  try {
    const { data, error } = await supabase
      .from('ai_corrections')
      .select('original_name, corrected_name')
      .eq('user_id', userId)
      .limit(100);

    if (error || !data) return [];

    const correctionMap = new Map<string, { corrected: string; count: number }>();

    data.forEach((item) => {
      const key = item.original_name.toLowerCase();
      const existing = correctionMap.get(key);

      if (existing && existing.corrected === item.corrected_name) {
        existing.count++;
      } else if (!existing) {
        correctionMap.set(key, {
          corrected: item.corrected_name,
          count: 1,
        });
      }
    });

    return Array.from(correctionMap.entries())
      .map(([original, { corrected, count }]) => ({
        original,
        corrected,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching corrections:', error);
    return [];
  }
}

export async function getGlobalCorrections(
  limit: number = 50
): Promise<
  Array<{
    original: string;
    corrected: string;
    count: number;
    confidence: number;
  }>
> {
  try {
    const { data, error } = await supabase.rpc('get_global_corrections', {
      result_limit: limit,
    });

    if (error || !data) return [];

    return data;
  } catch (error) {
    console.error('Error fetching global corrections:', error);
    return [];
  }
}

export async function buildUserSynonymMap(
  userId: string
): Promise<Record<string, string>> {
  const corrections = await getCommonCorrections(userId, 20);

  const synonymMap: Record<string, string> = {};

  corrections.forEach((correction) => {
    if (correction.count >= 2) {
      synonymMap[correction.original] = correction.corrected;
    }
  });

  return synonymMap;
}

export async function updatePortionPriors(
  userId: string
): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('ai_corrections')
      .select('corrected_name, corrected_portion')
      .eq('user_id', userId)
      .eq('correction_type', 'portion')
      .limit(100);

    if (error || !data) return {};

    const portionMap = new Map<string, number[]>();

    data.forEach((item) => {
      const key = item.corrected_name.toLowerCase();
      if (!portionMap.has(key)) {
        portionMap.set(key, []);
      }
      portionMap.get(key)!.push(item.corrected_portion);
    });

    const priors: Record<string, number> = {};

    portionMap.forEach((portions, name) => {
      if (portions.length >= 3) {
        const avg = portions.reduce((sum, p) => sum + p, 0) / portions.length;
        priors[name] = Math.round(avg);
      }
    });

    return priors;
  } catch (error) {
    console.error('Error updating portion priors:', error);
    return {};
  }
}

export async function getRecentUserFoods(
  userId: string,
  limit: number = 10
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('meal_log_items')
      .select('food_name, meal_logs!inner(user_id, logged_at)')
      .eq('meal_logs.user_id', userId)
      .order('meal_logs.logged_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const uniqueFoods = new Set<string>();
    data.forEach((item) => {
      if (item.food_name) uniqueFoods.add(item.food_name);
    });

    return Array.from(uniqueFoods);
  } catch (error) {
    console.error('Error fetching recent foods:', error);
    return [];
  }
}

export async function analyzeModelPerformance(
  modelVersion: string,
  days: number = 30
): Promise<{
  averageConfidence: number;
  correctionRate: number;
  commonErrors: Array<{ error: string; count: number }>;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: analyses } = await supabase
      .from('photo_analyses')
      .select('*, ai_corrections(*)')
      .eq('model_version', modelVersion)
      .gte('created_at', startDate.toISOString());

    if (!analyses) {
      return {
        averageConfidence: 0,
        correctionRate: 0,
        commonErrors: [],
      };
    }

    const totalConfidence = analyses.reduce(
      (sum, a) => sum + (a.overall_confidence || 0),
      0
    );
    const correctedCount = analyses.filter(
      (a) => a.ai_corrections && a.ai_corrections.length > 0
    ).length;

    const errorMap = new Map<string, number>();

    analyses.forEach((analysis) => {
      if (analysis.ai_corrections) {
        analysis.ai_corrections.forEach((correction: any) => {
          const error = `${correction.original_name} → ${correction.corrected_name}`;
          errorMap.set(error, (errorMap.get(error) || 0) + 1);
        });
      }
    });

    const commonErrors = Array.from(errorMap.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      averageConfidence: Math.round(totalConfidence / analyses.length),
      correctionRate: Math.round((correctedCount / analyses.length) * 100),
      commonErrors,
    };
  } catch (error) {
    console.error('Error analyzing model performance:', error);
    return {
      averageConfidence: 0,
      correctionRate: 0,
      commonErrors: [],
    };
  }
}
