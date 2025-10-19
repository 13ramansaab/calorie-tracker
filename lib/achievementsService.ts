import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/eventTracking';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement_value: number | null;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  achievement?: Achievement;
}

export async function getAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('requirement_value', { ascending: true });

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievement:achievements (*)
    `)
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return data || [];
}

export async function checkAndAwardAchievements(userId: string): Promise<UserAchievement[]> {
  const newAchievements: UserAchievement[] = [];

  try {
    await supabase.rpc('check_streak_achievements', { p_user_id: userId });
    await supabase.rpc('check_meal_achievements', { p_user_id: userId });

    const { data: recent } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements (*)
      `)
      .eq('user_id', userId)
      .gte('earned_at', new Date(Date.now() - 60000).toISOString());

    if (recent) {
      newAchievements.push(...recent);

      for (const achievement of recent) {
        await trackEvent(userId, 'achievement_earned', {
          achievement_id: achievement.achievement_id,
          achievement_name: achievement.achievement?.name,
        });
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }

  return newAchievements;
}

export async function awardAchievement(
  userId: string,
  achievementId: string
): Promise<UserAchievement | null> {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
      })
      .select(`
        *,
        achievement:achievements (*)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return null;
      }
      throw error;
    }

    await trackEvent(userId, 'achievement_earned', {
      achievement_id: achievementId,
    });

    return data;
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return null;
  }
}

export async function checkFirstPhotoAchievement(userId: string): Promise<UserAchievement | null> {
  const { data: hasPhoto } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('user_id', userId)
    .not('photo_url', 'is', null)
    .limit(1)
    .single();

  if (hasPhoto) {
    return await awardAchievement(userId, 'first_photo');
  }

  return null;
}

export async function checkFirstWeekAchievement(userId: string): Promise<UserAchievement | null> {
  const { data: logs } = await supabase
    .from('meal_logs')
    .select('logged_at')
    .eq('user_id', userId)
    .order('logged_at', { ascending: true });

  if (!logs || logs.length === 0) return null;

  const firstLog = new Date(logs[0].logged_at);
  const today = new Date();
  const daysSinceFirst = Math.floor(
    (today.getTime() - firstLog.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceFirst >= 7) {
    return await awardAchievement(userId, 'first_week');
  }

  return null;
}

export function getTierColor(tier: string): string {
  switch (tier) {
    case 'bronze':
      return '#cd7f32';
    case 'silver':
      return '#c0c0c0';
    case 'gold':
      return '#ffd700';
    case 'platinum':
      return '#e5e4e2';
    default:
      return '#9ca3af';
  }
}

export function getTierGradient(tier: string): string[] {
  switch (tier) {
    case 'bronze':
      return ['#cd7f32', '#a0522d'];
    case 'silver':
      return ['#e8e8e8', '#a8a8a8'];
    case 'gold':
      return ['#ffd700', '#ffb700'];
    case 'platinum':
      return ['#e5e4e2', '#b8b8b8'];
    default:
      return ['#9ca3af', '#6b7280'];
  }
}
