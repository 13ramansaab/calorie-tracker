import { supabase } from '@/lib/supabase';

export type AnalysisEventType =
  | 'ai_analysis_started'
  | 'ai_analysis_completed'
  | 'ai_analysis_failed'
  | 'vision_analysis_requested'
  | 'text_analysis_requested'
  | 'manual_edit_made'
  | 'cache_hit'
  | 'retry_attempted'
  | 'quota_exceeded';

export interface AnalysisMetrics {
  latency_ms: number;
  error_type?: string;
  error_message?: string;
  confidence_avg?: number;
  items_count?: number;
  note_used?: boolean;
  was_cached?: boolean;
  retry_count?: number;
  image_size_mb?: number;
}

export async function logAnalysisEvent(
  userId: string,
  eventType: AnalysisEventType,
  metrics: AnalysisMetrics,
  analysisId?: string
): Promise<void> {
  try {
    await supabase.from('analysis_events').insert({
      user_id: userId,
      event_type: eventType,
      analysis_id: analysisId || null,
      event_data: {
        ...metrics,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to log analysis event:', error);
  }
}

export async function getAnalysisSuccessRate(
  startDate: Date,
  endDate: Date
): Promise<{ successRate: number; totalAnalyses: number }> {
  try {
    const { data: started } = await supabase
      .from('analysis_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'ai_analysis_started')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: completed } = await supabase
      .from('analysis_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'ai_analysis_completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalStarted = started?.length || 0;
    const totalCompleted = completed?.length || 0;

    const successRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    return { successRate, totalAnalyses: totalStarted };
  } catch (error) {
    console.error('Error calculating success rate:', error);
    return { successRate: 0, totalAnalyses: 0 };
  }
}

export async function getAverageLatency(
  startDate: Date,
  endDate: Date
): Promise<{ avgLatency: number; p95Latency: number }> {
  try {
    const { data } = await supabase
      .from('analysis_events')
      .select('event_data')
      .eq('event_type', 'ai_analysis_completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (!data || data.length === 0) {
      return { avgLatency: 0, p95Latency: 0 };
    }

    const latencies = data
      .map((event) => event.event_data?.latency_ms)
      .filter((latency) => typeof latency === 'number')
      .sort((a, b) => a - b);

    if (latencies.length === 0) {
      return { avgLatency: 0, p95Latency: 0 };
    }

    const avgLatency = latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length;

    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index] || latencies[latencies.length - 1];

    return { avgLatency, p95Latency };
  } catch (error) {
    console.error('Error calculating latency:', error);
    return { avgLatency: 0, p95Latency: 0 };
  }
}

export async function getErrorRate(
  startDate: Date,
  endDate: Date
): Promise<{ errorRate: number; errorTypes: Record<string, number> }> {
  try {
    const { data: started } = await supabase
      .from('analysis_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'ai_analysis_started')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: failed } = await supabase
      .from('analysis_events')
      .select('event_data')
      .eq('event_type', 'ai_analysis_failed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalStarted = started?.length || 0;
    const totalFailed = failed?.length || 0;

    const errorRate = totalStarted > 0 ? (totalFailed / totalStarted) * 100 : 0;

    const errorTypes: Record<string, number> = {};
    failed?.forEach((event) => {
      const errorType = event.event_data?.error_type || 'unknown';
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    return { errorRate, errorTypes };
  } catch (error) {
    console.error('Error calculating error rate:', error);
    return { errorRate: 0, errorTypes: {} };
  }
}

export async function getEditRate(startDate: Date, endDate: Date): Promise<number> {
  try {
    const { data: completed } = await supabase
      .from('analysis_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'ai_analysis_completed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: edited } = await supabase
      .from('analysis_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'manual_edit_made')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalCompleted = completed?.length || 0;
    const totalEdited = edited?.length || 0;

    return totalCompleted > 0 ? (totalEdited / totalCompleted) * 100 : 0;
  } catch (error) {
    console.error('Error calculating edit rate:', error);
    return 0;
  }
}

export async function checkHealthThresholds(): Promise<{
  healthy: boolean;
  alerts: string[];
}> {
  const alerts: string[] = [];
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  const { errorRate } = await getErrorRate(fifteenMinutesAgo, now);
  if (errorRate > 10) {
    alerts.push(`Error rate is ${errorRate.toFixed(1)}% (threshold: 10%)`);
  }

  const { p95Latency } = await getAverageLatency(fifteenMinutesAgo, now);
  if (p95Latency > 8000) {
    alerts.push(`P95 latency is ${(p95Latency / 1000).toFixed(1)}s (threshold: 8s)`);
  }

  return {
    healthy: alerts.length === 0,
    alerts,
  };
}

export async function getDashboardMetrics(): Promise<{
  successRate: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  editRate: number;
  totalAnalyses: number;
}> {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [successStats, latencyStats, errorStats, editRate] = await Promise.all([
    getAnalysisSuccessRate(oneDayAgo, now),
    getAverageLatency(oneDayAgo, now),
    getErrorRate(oneDayAgo, now),
    getEditRate(oneDayAgo, now),
  ]);

  return {
    successRate: successStats.successRate,
    avgLatency: latencyStats.avgLatency,
    p95Latency: latencyStats.p95Latency,
    errorRate: errorStats.errorRate,
    editRate,
    totalAnalyses: successStats.totalAnalyses,
  };
}
