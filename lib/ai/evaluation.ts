import { supabase } from '@/lib/supabase';

export interface EvaluationMetrics {
  nameTop1Accuracy: number;
  portionRMSE: number;
  caloriesMAE: number;
  editRate: number;
  avgTimeToConfirm: number;
  sampleSize: number;
}

export interface DishCategoryMetrics {
  category: string;
  accuracy: number;
  avgConfidence: number;
  editRate: number;
  sampleCount: number;
}

export async function calculateNameAccuracy(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data: corrections, error } = await supabase
    .from('ai_corrections')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('correction_type', 'name');

  if (error || !corrections) return 0;

  const { data: totalAnalyses } = await supabase
    .from('photo_analyses')
    .select('id', { count: 'exact' })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('status', 'confirmed');

  const totalCount = totalAnalyses?.length || 0;
  const incorrectCount = corrections.length;

  if (totalCount === 0) return 0;

  return ((totalCount - incorrectCount) / totalCount) * 100;
}

export async function calculatePortionRMSE(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data: corrections, error } = await supabase
    .from('ai_corrections')
    .select('original_portion, corrected_portion')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .in('correction_type', ['portion', 'all']);

  if (error || !corrections || corrections.length === 0) return 0;

  const squaredErrors = corrections.map((c) => {
    const diff = c.original_portion - c.corrected_portion;
    return diff * diff;
  });

  const meanSquaredError =
    squaredErrors.reduce((sum, val) => sum + val, 0) / squaredErrors.length;

  return Math.sqrt(meanSquaredError);
}

export async function calculateCaloriesMAE(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data: corrections, error } = await supabase
    .from('ai_corrections')
    .select('original_calories, corrected_calories')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error || !corrections || corrections.length === 0) return 0;

  const absoluteErrors = corrections.map((c) =>
    Math.abs(c.original_calories - c.corrected_calories)
  );

  return (
    absoluteErrors.reduce((sum, val) => sum + val, 0) / absoluteErrors.length
  );
}

export async function calculateEditRate(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const { data: analyses, error: analysesError } = await supabase
    .from('photo_analyses')
    .select('id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('status', 'confirmed');

  if (analysesError || !analyses) return 0;

  const { data: corrections, error: correctionsError } = await supabase
    .from('ai_corrections')
    .select('analysis_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (correctionsError || !corrections) return 0;

  const uniqueEditedAnalyses = new Set(
    corrections.map((c) => c.analysis_id)
  ).size;

  if (analyses.length === 0) return 0;

  return (uniqueEditedAnalyses / analyses.length) * 100;
}

export async function getEvaluationMetrics(
  startDate: Date,
  endDate: Date
): Promise<EvaluationMetrics> {
  const [nameAccuracy, portionRMSE, caloriesMAE, editRate] = await Promise.all([
    calculateNameAccuracy(startDate, endDate),
    calculatePortionRMSE(startDate, endDate),
    calculateCaloriesMAE(startDate, endDate),
    calculateEditRate(startDate, endDate),
  ]);

  const { data: analyses } = await supabase
    .from('photo_analyses')
    .select('id', { count: 'exact' })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .eq('status', 'confirmed');

  return {
    nameTop1Accuracy: nameAccuracy,
    portionRMSE,
    caloriesMAE,
    editRate,
    avgTimeToConfirm: 0,
    sampleSize: analyses?.length || 0,
  };
}

export async function getMetricsByDishCategory(): Promise<DishCategoryMetrics[]> {
  const { data, error } = await supabase.rpc('get_metrics_by_category');

  if (error) {
    console.error('Error fetching category metrics:', error);
    return [];
  }

  return data || [];
}

export async function getMetricsByLightCondition(): Promise<
  Array<{
    condition: string;
    accuracy: number;
    avgConfidence: number;
    sampleCount: number;
  }>
> {
  return [];
}

export async function getRecentSamplesForReview(
  limit: number = 50
): Promise<
  Array<{
    id: string;
    image_url: string;
    detected_dishes: any;
    overall_confidence: number;
    has_corrections: boolean;
    created_at: string;
  }>
> {
  const { data: analyses, error: analysesError } = await supabase
    .from('photo_analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (analysesError || !analyses) return [];

  const analysisIds = analyses.map((a) => a.id);

  const { data: corrections } = await supabase
    .from('ai_corrections')
    .select('analysis_id')
    .in('analysis_id', analysisIds);

  const correctedIds = new Set(corrections?.map((c) => c.analysis_id) || []);

  return analyses.map((a) => ({
    id: a.id,
    image_url: a.image_url,
    detected_dishes: a.detected_dishes,
    overall_confidence: a.overall_confidence,
    has_corrections: correctedIds.has(a.id),
    created_at: a.created_at,
  }));
}

export interface AccuracyTrend {
  date: string;
  accuracy: number;
  sampleCount: number;
}

export async function getAccuracyTrendOverTime(
  days: number = 30
): Promise<AccuracyTrend[]> {
  const trends: AccuracyTrend[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const accuracy = await calculateNameAccuracy(date, nextDate);

    const { data: analyses } = await supabase
      .from('photo_analyses')
      .select('id', { count: 'exact' })
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDate.toISOString())
      .eq('status', 'confirmed');

    trends.push({
      date: date.toISOString().split('T')[0],
      accuracy,
      sampleCount: analyses?.length || 0,
    });
  }

  return trends;
}

export interface QualityReport {
  period: string;
  metrics: EvaluationMetrics;
  trends: AccuracyTrend[];
  topCorrections: Array<{
    original: string;
    corrected: string;
    count: number;
  }>;
  lowConfidenceDishes: Array<{
    dish: string;
    avgConfidence: number;
    count: number;
  }>;
}

export async function generateQualityReport(
  days: number = 7
): Promise<QualityReport> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [metrics, trends, topCorrections] = await Promise.all([
    getEvaluationMetrics(startDate, endDate),
    getAccuracyTrendOverTime(days),
    getTopCorrections(10),
  ]);

  return {
    period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
    metrics,
    trends,
    topCorrections,
    lowConfidenceDishes: [],
  };
}

export async function getTopCorrections(
  limit: number = 10
): Promise<Array<{ original: string; corrected: string; count: number }>> {
  const { data, error } = await supabase.rpc('get_global_corrections', {
    result_limit: limit,
  });

  if (error) {
    console.error('Error fetching top corrections:', error);
    return [];
  }

  return (
    data?.map((row: any) => ({
      original: row.original,
      corrected: row.corrected,
      count: row.count,
    })) || []
  );
}

export const MVP_TARGETS = {
  nameTop1Accuracy: 85,
  portionRMSE: 40,
  caloriesMAE: 50,
  editRate: 35,
};

export function evaluateAgainstTargets(
  metrics: EvaluationMetrics
): {
  meetsTargets: boolean;
  gaps: Array<{ metric: string; target: number; actual: number; gap: number }>;
} {
  const gaps = [];

  if (metrics.nameTop1Accuracy < MVP_TARGETS.nameTop1Accuracy) {
    gaps.push({
      metric: 'Name Accuracy',
      target: MVP_TARGETS.nameTop1Accuracy,
      actual: metrics.nameTop1Accuracy,
      gap: MVP_TARGETS.nameTop1Accuracy - metrics.nameTop1Accuracy,
    });
  }

  if (metrics.portionRMSE > MVP_TARGETS.portionRMSE) {
    gaps.push({
      metric: 'Portion RMSE',
      target: MVP_TARGETS.portionRMSE,
      actual: metrics.portionRMSE,
      gap: metrics.portionRMSE - MVP_TARGETS.portionRMSE,
    });
  }

  if (metrics.caloriesMAE > MVP_TARGETS.caloriesMAE) {
    gaps.push({
      metric: 'Calories MAE',
      target: MVP_TARGETS.caloriesMAE,
      actual: metrics.caloriesMAE,
      gap: metrics.caloriesMAE - MVP_TARGETS.caloriesMAE,
    });
  }

  if (metrics.editRate > MVP_TARGETS.editRate) {
    gaps.push({
      metric: 'Edit Rate',
      target: MVP_TARGETS.editRate,
      actual: metrics.editRate,
      gap: metrics.editRate - MVP_TARGETS.editRate,
    });
  }

  return {
    meetsTargets: gaps.length === 0,
    gaps,
  };
}
