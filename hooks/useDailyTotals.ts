import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyTotal {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_count: number;
}

export function useDailyTotals(days: 7 | 30 = 7) {
  const { user } = useAuth();
  const [data, setData] = useState<DailyTotal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadData();
  }, [user, days]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      startDate.setHours(0, 0, 0, 0);

      const { data: totals, error: fetchError } = await supabase
        .from('daily_totals')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const filledData: DailyTotal[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const existing = totals?.find((t) => t.date === dateStr);

        filledData.push({
          date: dateStr,
          total_calories: existing?.total_calories || 0,
          total_protein: existing?.total_protein || 0,
          total_carbs: existing?.total_carbs || 0,
          total_fat: existing?.total_fat || 0,
          meal_count: existing?.meal_count || 0,
        });
      }

      setData(filledData);
    } catch (err) {
      console.error('Error loading daily totals:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    loadData();
  };

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}

export function useWeeklySummary() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    avgCalories: 0,
    avgProtein: 0,
    avgCarbs: 0,
    avgFat: 0,
    totalMeals: 0,
    daysLogged: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadSummary();
  }, [user]);

  const loadSummary = async () => {
    if (!user) return;

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data: totals } = await supabase
        .from('daily_totals')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (totals && totals.length > 0) {
        const totalCalories = totals.reduce((sum, t) => sum + (t.total_calories || 0), 0);
        const totalProtein = totals.reduce((sum, t) => sum + (t.total_protein || 0), 0);
        const totalCarbs = totals.reduce((sum, t) => sum + (t.total_carbs || 0), 0);
        const totalFat = totals.reduce((sum, t) => sum + (t.total_fat || 0), 0);
        const totalMeals = totals.reduce((sum, t) => sum + (t.meal_count || 0), 0);
        const daysLogged = totals.filter((t) => t.meal_count > 0).length;

        setSummary({
          avgCalories: Math.round(totalCalories / 7),
          avgProtein: Math.round(totalProtein / 7),
          avgCarbs: Math.round(totalCarbs / 7),
          avgFat: Math.round(totalFat / 7),
          totalMeals,
          daysLogged,
        });
      }
    } catch (error) {
      console.error('Error loading weekly summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    summary,
    isLoading,
    refresh: loadSummary,
  };
}
