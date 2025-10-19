import { supabase } from '@/lib/supabase';

export interface SuccessMetrics {
  editRateReduction: number;
  caloriesMAEImprovement: number;
  timeToSaveImprovement: number;
  noteUsageRate: number;
}

export interface EditRateMetric {
  withNote: number;
  withoutNote: number;
  absoluteReduction: number;
  percentageReduction: number;
}

export interface MAEMetric {
  withNote: number;
  withoutNote: number;
  improvement: number;
}

export async function trackMealSaveTime(
  userId: string,
  photoUri: string,
  captureTime: Date,
  saveTime: Date,
  hadNote: boolean
): Promise<void> {
  const timeToSave = (saveTime.getTime() - captureTime.getTime()) / 1000;

  await supabase.from('analysis_events').insert({
    user_id: userId,
    event_type: 'time_to_save',
    event_data: {
      photo_uri: photoUri,
      time_to_save_seconds: timeToSave,
      had_note: hadNote,
      timestamp: saveTime.toISOString(),
    },
  });
}

export async function trackEditCount(
  userId: string,
  mealLogId: string,
  editCount: number,
  hadNote: boolean
): Promise<void> {
  await supabase.from('analysis_events').insert({
    user_id: userId,
    event_type: 'edit_count',
    event_data: {
      meal_log_id: mealLogId,
      edit_count: editCount,
      had_note: hadNote,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function trackCaloriesAccuracy(
  userId: string,
  mealLogId: string,
  aiCalories: number,
  finalCalories: number,
  hadNote: boolean,
  goldStandardCalories?: number
): Promise<void> {
  const error = goldStandardCalories
    ? Math.abs(finalCalories - goldStandardCalories)
    : Math.abs(aiCalories - finalCalories);

  await supabase.from('analysis_events').insert({
    user_id: userId,
    event_type: 'calories_accuracy',
    event_data: {
      meal_log_id: mealLogId,
      ai_calories: aiCalories,
      final_calories: finalCalories,
      gold_standard_calories: goldStandardCalories,
      absolute_error: error,
      had_note: hadNote,
      timestamp: new Date().toISOString(),
    },
  });
}

export async function calculateEditRateMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<EditRateMetric> {
  const start = startDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const { data, error } = await supabase
    .from('analysis_events')
    .select('event_data')
    .eq('event_type', 'edit_count')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error || !data || data.length === 0) {
    return {
      withNote: 0,
      withoutNote: 0,
      absoluteReduction: 0,
      percentageReduction: 0,
    };
  }

  const withNote = data.filter((e: any) => e.event_data.had_note);
  const withoutNote = data.filter((e: any) => !e.event_data.had_note);

  const avgWithNote =
    withNote.length > 0
      ? withNote.reduce((sum: number, e: any) => sum + e.event_data.edit_count, 0) /
        withNote.length
      : 0;

  const avgWithoutNote =
    withoutNote.length > 0
      ? withoutNote.reduce((sum: number, e: any) => sum + e.event_data.edit_count, 0) /
        withoutNote.length
      : 0;

  const absoluteReduction = avgWithoutNote - avgWithNote;
  const percentageReduction =
    avgWithoutNote > 0 ? (absoluteReduction / avgWithoutNote) * 100 : 0;

  return {
    withNote: Math.round(avgWithNote * 10) / 10,
    withoutNote: Math.round(avgWithoutNote * 10) / 10,
    absoluteReduction: Math.round(absoluteReduction * 10) / 10,
    percentageReduction: Math.round(percentageReduction),
  };
}

export async function calculateMAEMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<MAEMetric> {
  const start = startDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const { data, error } = await supabase
    .from('analysis_events')
    .select('event_data')
    .eq('event_type', 'calories_accuracy')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error || !data || data.length === 0) {
    return {
      withNote: 0,
      withoutNote: 0,
      improvement: 0,
    };
  }

  const withNote = data.filter((e: any) => e.event_data.had_note);
  const withoutNote = data.filter((e: any) => !e.event_data.had_note);

  const maeWithNote =
    withNote.length > 0
      ? withNote.reduce((sum: number, e: any) => sum + e.event_data.absolute_error, 0) /
        withNote.length
      : 0;

  const maeWithoutNote =
    withoutNote.length > 0
      ? withoutNote.reduce((sum: number, e: any) => sum + e.event_data.absolute_error, 0) /
        withoutNote.length
      : 0;

  const improvement =
    maeWithoutNote > 0 ? ((maeWithoutNote - maeWithNote) / maeWithoutNote) * 100 : 0;

  return {
    withNote: Math.round(maeWithNote),
    withoutNote: Math.round(maeWithoutNote),
    improvement: Math.round(improvement),
  };
}

export async function calculateTimeToSaveMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<{ avgSeconds: number; improvement: number }> {
  const start = startDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const { data, error } = await supabase
    .from('analysis_events')
    .select('event_data')
    .eq('event_type', 'time_to_save')
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (error || !data || data.length === 0) {
    return { avgSeconds: 0, improvement: 0 };
  }

  const withNote = data.filter((e: any) => e.event_data.had_note);
  const withoutNote = data.filter((e: any) => !e.event_data.had_note);

  const avgWithNote =
    withNote.length > 0
      ? withNote.reduce((sum: number, e: any) => sum + e.event_data.time_to_save_seconds, 0) /
        withNote.length
      : 0;

  const avgWithoutNote =
    withoutNote.length > 0
      ? withoutNote.reduce((sum: number, e: any) => sum + e.event_data.time_to_save_seconds, 0) /
        withoutNote.length
      : 0;

  const improvement =
    avgWithoutNote > 0 ? ((avgWithoutNote - avgWithNote) / avgWithoutNote) * 100 : 0;

  return {
    avgSeconds: Math.round(avgWithNote),
    improvement: Math.round(improvement),
  };
}

export async function calculateNoteUsageRate(
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const start = startDate || new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  const { data: totalLogs, error: totalError } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('source', 'photo')
    .gte('logged_at', start.toISOString())
    .lte('logged_at', end.toISOString());

  const { data: logsWithNote, error: noteError } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('source', 'photo')
    .not('context_note', 'is', null)
    .gte('logged_at', start.toISOString())
    .lte('logged_at', end.toISOString());

  if (totalError || noteError || !totalLogs || totalLogs.length === 0) {
    return 0;
  }

  const rate = (logsWithNote?.length || 0) / totalLogs.length;
  return Math.round(rate * 100);
}

export async function getSuccessMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<SuccessMetrics> {
  const editRate = await calculateEditRateMetrics(startDate, endDate);
  const mae = await calculateMAEMetrics(startDate, endDate);
  const timeToSave = await calculateTimeToSaveMetrics(startDate, endDate);
  const noteUsage = await calculateNoteUsageRate(startDate, endDate);

  return {
    editRateReduction: editRate.absoluteReduction,
    caloriesMAEImprovement: mae.improvement,
    timeToSaveImprovement: timeToSave.improvement,
    noteUsageRate: noteUsage,
  };
}

export function checkSuccessThresholds(metrics: SuccessMetrics): {
  editRateMet: boolean;
  maeMet: boolean;
  timeToSaveMet: boolean;
  noteUsageMet: boolean;
  allMet: boolean;
} {
  const editRateMet = metrics.editRateReduction >= 10;
  const maeMet = metrics.caloriesMAEImprovement >= 8;
  const timeToSaveMet = metrics.timeToSaveImprovement >= 15;
  const noteUsageMet = metrics.noteUsageRate >= 60;

  return {
    editRateMet,
    maeMet,
    timeToSaveMet,
    noteUsageMet,
    allMet: editRateMet && maeMet && timeToSaveMet && noteUsageMet,
  };
}
