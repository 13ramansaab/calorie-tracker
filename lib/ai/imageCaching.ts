import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const CACHE_DURATION_DAYS = 7;

export interface CachedAnalysis {
  image_hash: string;
  analysis_result: any;
  created_at: string;
}

export async function generateImageHash(imageUri: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 1,
    });

    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64
    );

    return hash;
  } catch (error) {
    console.error('Error generating image hash:', error);
    return null;
  }
}

export async function getCachedAnalysis(imageHash: string): Promise<any | null> {
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - CACHE_DURATION_DAYS);

    const { data, error } = await supabase
      .from('photo_analyses')
      .select('*')
      .eq('image_hash', imageHash)
      .gte('created_at', expirationDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    console.log('✅ Cache hit for image hash:', imageHash);
    return data.parsed_output || data.raw_response;
  } catch (error) {
    console.error('Error getting cached analysis:', error);
    return null;
  }
}

export async function saveCachedAnalysis(
  imageHash: string,
  analysisResult: any,
  userId: string,
  photoUrl: string
): Promise<void> {
  try {
    await supabase.from('photo_analyses').insert({
      user_id: userId,
      photo_url: photoUrl,
      image_hash: imageHash,
      parsed_output: analysisResult,
      raw_response: analysisResult,
      created_at: new Date().toISOString(),
    });

    console.log('💾 Saved analysis to cache for hash:', imageHash);
  } catch (error) {
    console.error('Error saving cached analysis:', error);
  }
}

export async function cleanExpiredCache(): Promise<number> {
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - CACHE_DURATION_DAYS);

    const { data, error } = await supabase
      .from('photo_analyses')
      .delete()
      .lt('created_at', expirationDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning expired cache:', error);
      return 0;
    }

    const deletedCount = data?.length || 0;
    console.log(`🧹 Cleaned ${deletedCount} expired cache entries`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning cache:', error);
    return 0;
  }
}

export async function getCacheStats(userId: string): Promise<{
  totalCached: number;
  cacheHitRate: number;
  avgLatencySaved: number;
}> {
  try {
    const { data: cached } = await supabase
      .from('photo_analyses')
      .select('id')
      .eq('user_id', userId);

    const { data: analyses } = await supabase
      .from('photo_analyses')
      .select('latency_ms')
      .eq('user_id', userId)
      .not('latency_ms', 'is', null);

    const totalCached = cached?.length || 0;
    const avgLatency = analyses?.length
      ? analyses.reduce((sum, a) => sum + (a.latency_ms || 0), 0) / analyses.length
      : 0;

    return {
      totalCached,
      cacheHitRate: 0,
      avgLatencySaved: avgLatency,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalCached: 0,
      cacheHitRate: 0,
      avgLatencySaved: 0,
    };
  }
}
