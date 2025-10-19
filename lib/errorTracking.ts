import { supabase } from '@/lib/supabase';

export type ErrorType = 'network' | 'model' | 'mapping' | 'validation' | 'system' | 'auth' | 'payment';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorContext {
  operation?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export async function logError(
  errorType: ErrorType,
  error: Error | string,
  context?: ErrorContext,
  severity: ErrorSeverity = 'medium'
): Promise<void> {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? undefined : error.stack;

    const { error: dbError } = await supabase.rpc('log_error', {
      p_user_id: context?.userId || null,
      p_error_type: errorType,
      p_error_message: errorMessage,
      p_stack_trace: stackTrace || null,
      p_context: context?.metadata || {},
      p_severity: severity,
    });

    if (dbError) {
      console.error('Failed to log error to database:', dbError);
    }
  } catch (err) {
    console.error('Error in error tracking:', err);
  }
}

export async function trackPerformance(
  userId: string | undefined,
  operationName: string,
  latencyMs: number,
  success: boolean = true,
  errorMessage?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase.rpc('track_performance', {
      p_user_id: userId || null,
      p_operation_name: operationName,
      p_latency_ms: latencyMs,
      p_success: success,
      p_error_message: errorMessage || null,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error('Failed to track performance:', error);
    }
  } catch (err) {
    console.error('Error in performance tracking:', err);
  }
}

export async function trackAnalysisOperation<T>(
  userId: string | undefined,
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = true;
  let errorMessage: string | undefined;

  try {
    const result = await operation();
    return result;
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw error;
  } finally {
    const latencyMs = Date.now() - startTime;
    await trackPerformance(userId, operationName, latencyMs, success, errorMessage);
  }
}

export function categorizeError(error: any): {
  type: ErrorType;
  severity: ErrorSeverity;
} {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toLowerCase() || '';

  if (errorCode === 'network_error' || errorMessage.includes('network')) {
    return { type: 'network', severity: 'medium' };
  }

  if (errorMessage.includes('timeout')) {
    return { type: 'network', severity: 'high' };
  }

  if (errorMessage.includes('model') || errorMessage.includes('openai') || errorMessage.includes('api')) {
    return { type: 'model', severity: 'high' };
  }

  if (errorMessage.includes('mapping') || errorMessage.includes('parse') || errorMessage.includes('json')) {
    return { type: 'mapping', severity: 'medium' };
  }

  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return { type: 'validation', severity: 'low' };
  }

  if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    return { type: 'auth', severity: 'high' };
  }

  if (errorMessage.includes('payment') || errorMessage.includes('stripe')) {
    return { type: 'payment', severity: 'critical' };
  }

  return { type: 'system', severity: 'medium' };
}

export async function logCategorizedError(
  error: any,
  context?: ErrorContext
): Promise<void> {
  const { type, severity } = categorizeError(error);
  await logError(type, error, context, severity);
}

export async function getErrorSummary(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('error_summary')
      .select('*')
      .limit(50);

    if (error) {
      console.error('Failed to fetch error summary:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching error summary:', err);
    return [];
  }
}

export async function resolveErrorGroup(errorGroupHash: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('resolve_error_group', {
      p_error_group_hash: errorGroupHash,
    });

    if (error) {
      console.error('Failed to resolve error group:', error);
    }
  } catch (err) {
    console.error('Error resolving error group:', err);
  }
}

export async function getDashboardStats(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');

    if (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {};
    }

    const stats: Record<string, any> = {};
    data?.forEach((row: any) => {
      stats[row.metric_name] = {
        value: row.metric_value,
        metadata: row.metadata,
      };
    });

    return stats;
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    return {};
  }
}

export function setupGlobalErrorHandler(userId?: string): void {
  if (typeof ErrorUtils !== 'undefined') {
    const defaultHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logCategorizedError(error, {
        userId,
        metadata: { isFatal },
      });

      if (defaultHandler) {
        defaultHandler(error, isFatal);
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      logCategorizedError(event.reason, {
        userId,
        metadata: { type: 'unhandledRejection' },
      });
    });
  }
}
