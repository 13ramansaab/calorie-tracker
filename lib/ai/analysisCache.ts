import { supabase } from '@/lib/supabase';
import * as Crypto from 'expo-crypto';

const CACHE_DURATION_DAYS = 7;

export interface CachedAnalysis {
  id: string;
  image_hash: string;
  user_note: string | null;
  parsed_output: any;
  overall_confidence: number;
  cached_at: string;
}

export async function computeImageHash(imageUri: string): Promise<string> {
  try {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      imageUri
    );
    return digest;
  } catch (error) {
    console.error('Error computing image hash:', error);
    return imageUri;
  }
}

export async function getCachedAnalysis(
  userId: string,
  imageHash: string,
  userNote?: string
): Promise<CachedAnalysis | null> {
  try {
    const cacheExpiryDate = new Date();
    cacheExpiryDate.setDate(cacheExpiryDate.getDate() - CACHE_DURATION_DAYS);

    let query = supabase
      .from('photo_analyses')
      .select('id, image_hash, user_note, parsed_output, overall_confidence, created_at')
      .eq('user_id', userId)
      .eq('image_hash', imageHash)
      .eq('status', 'saved')
      .gte('created_at', cacheExpiryDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (userNote) {
      query = query.eq('user_note', userNote);
    } else {
      query = query.is('user_note', null);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    const cached = data[0];

    return {
      id: cached.id,
      image_hash: cached.image_hash,
      user_note: cached.user_note,
      parsed_output: cached.parsed_output,
      overall_confidence: cached.overall_confidence,
      cached_at: cached.created_at,
    };
  } catch (error) {
    console.error('Error fetching cached analysis:', error);
    return null;
  }
}

export async function saveCachedAnalysis(
  userId: string,
  imageHash: string,
  analysisId: string
): Promise<void> {
  try {
    await supabase
      .from('photo_analyses')
      .update({ image_hash: imageHash })
      .eq('id', analysisId);
  } catch (error) {
    console.error('Error saving image hash:', error);
  }
}

export async function shouldUseCachedAnalysis(
  userId: string,
  imageUri: string,
  userNote?: string
): Promise<{ useCache: boolean; cachedAnalysis?: CachedAnalysis }> {
  try {
    const imageHash = await computeImageHash(imageUri);
    const cached = await getCachedAnalysis(userId, imageHash, userNote);

    if (cached) {
      console.log(`[Cache Hit] Using cached analysis from ${cached.cached_at}`);
      return { useCache: true, cachedAnalysis: cached };
    }

    return { useCache: false };
  } catch (error) {
    console.error('Error checking cache:', error);
    return { useCache: false };
  }
}

export async function clearOldCache(userId: string, daysOld: number = 30): Promise<number> {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('photo_analyses')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', expiryDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error clearing old cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
}
