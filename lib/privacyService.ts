import { supabase } from '@/lib/supabase';
import { logError } from './errorTracking';

export interface DeletionRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  scheduled_deletion_at: string;
  completed_at?: string;
}

export interface DataExportRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  export_url?: string;
  expires_at?: string;
  file_size_bytes?: number;
  requested_at: string;
  completed_at?: string;
}

export async function requestAccountDeletion(
  userId: string,
  reason?: string
): Promise<DeletionRequest> {
  try {
    const { data, error } = await supabase.rpc('request_account_deletion', {
      p_user_id: userId,
      p_reason: reason || null,
    });

    if (error) throw error;

    const { data: request } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!request) {
      throw new Error('Deletion request not found after creation');
    }

    return request;
  } catch (error) {
    await logError('system', error as Error, {
      userId,
      operation: 'request_account_deletion',
    });
    throw error;
  }
}

export async function cancelAccountDeletion(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('data_deletion_requests')
      .update({ status: 'failed', error_message: 'Cancelled by user' })
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) throw error;
  } catch (error) {
    await logError('system', error as Error, {
      userId,
      operation: 'cancel_account_deletion',
    });
    throw error;
  }
}

export async function getDeletionRequest(userId: string): Promise<DeletionRequest | null> {
  try {
    const { data, error } = await supabase
      .from('data_deletion_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching deletion request:', error);
    return null;
  }
}

export async function requestDataExport(userId: string): Promise<DataExportRequest> {
  try {
    const { data, error } = await supabase.rpc('generate_data_export', {
      p_user_id: userId,
    });

    if (error) throw error;

    const { data: request } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!request) {
      throw new Error('Export request not found after creation');
    }

    return request;
  } catch (error) {
    await logError('system', error as Error, {
      userId,
      operation: 'request_data_export',
    });
    throw error;
  }
}

export async function getDataExportRequest(userId: string): Promise<DataExportRequest | null> {
  try {
    const { data, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching export request:', error);
    return null;
  }
}

export async function getAllDataExports(userId: string): Promise<DataExportRequest[]> {
  try {
    const { data, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching export requests:', error);
    return [];
  }
}

export async function generateUserDataSnapshot(userId: string): Promise<any> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: meals } = await supabase
      .from('meal_logs')
      .select(`
        *,
        meal_log_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: corrections } = await supabase
      .from('ai_corrections')
      .select('*')
      .eq('user_id', userId);

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    const snapshot = {
      exportDate: new Date().toISOString(),
      userId,
      profile: profile || {},
      meals: meals || [],
      subscription: subscription || {},
      aiCorrections: corrections || [],
      achievements: achievements || [],
      totalMeals: meals?.length || 0,
    };

    return snapshot;
  } catch (error) {
    await logError('system', error as Error, {
      userId,
      operation: 'generate_user_data_snapshot',
    });
    throw error;
  }
}

export function getDaysUntilDeletion(scheduledAt: string): number {
  const scheduled = new Date(scheduledAt);
  const now = new Date();
  const diffTime = scheduled.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function isExportExpired(expiresAt?: string): boolean {
  if (!expiresAt) return true;

  const expires = new Date(expiresAt);
  const now = new Date();

  return now > expires;
}
