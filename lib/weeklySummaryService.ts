import { supabase } from '@/lib/supabase';

export interface WeeklySummary {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  total_calories: number;
  avg_daily_calories: number;
  compliance_percentage: number;
  top_dishes: Array<{ name: string; count: number }>;
  tip: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface SummaryData {
  total_calories: number;
  avg_daily_calories: number;
  compliance_percentage: number;
  top_dishes: Array<{ name: string; count: number }>;
  days_logged: number;
  goal_calories: number;
}

const TIPS = [
  "Try meal prepping on Sundays to stay on track during busy weekdays!",
  "Don't forget to log your snacks - they add up throughout the day.",
  "Aim for 25-30g of protein per meal to stay fuller longer.",
  "Hydration matters! Drinking water can help with portion control.",
  "Great progress! Small consistent changes lead to big results.",
  "Consider adding more vegetables to your meals for volume and nutrients.",
  "Consistency beats perfection. Keep showing up!",
  "Track your measurements, not just the scale. Progress takes many forms.",
  "Plan your treats! Enjoying food you love is part of a sustainable approach.",
  "Sleep quality affects hunger hormones. Aim for 7-8 hours per night.",
];

function getRandomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const current = new Date(date);
  const dayOfWeek = current.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const start = new Date(current);
  start.setDate(current.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getPreviousWeekRange(): { start: Date; end: Date } {
  const today = new Date();
  today.setDate(today.getDate() - 7);
  return getWeekRange(today);
}

export async function generateWeeklySummary(userId: string): Promise<WeeklySummary | null> {
  const { start, end } = getPreviousWeekRange();

  try {
    const { data, error } = await supabase.rpc('generate_weekly_summary', {
      p_user_id: userId,
      p_week_start: start.toISOString().split('T')[0],
      p_week_end: end.toISOString().split('T')[0],
    });

    if (error) {
      console.error('Error generating summary:', error);
      return null;
    }

    const summaryData = data as SummaryData;

    const tip = getRandomTip();

    const { data: summary, error: insertError } = await supabase
      .from('weekly_summaries')
      .insert({
        user_id: userId,
        week_start: start.toISOString().split('T')[0],
        week_end: end.toISOString().split('T')[0],
        total_calories: summaryData.total_calories,
        avg_daily_calories: summaryData.avg_daily_calories,
        compliance_percentage: summaryData.compliance_percentage,
        top_dishes: summaryData.top_dishes,
        tip,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting summary:', insertError);
      return null;
    }

    return summary;
  } catch (error) {
    console.error('Error in generateWeeklySummary:', error);
    return null;
  }
}

export async function getWeeklySummaries(
  userId: string,
  limit: number = 10
): Promise<WeeklySummary[]> {
  const { data, error } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching summaries:', error);
    return [];
  }

  return data || [];
}

export async function getLatestWeeklySummary(userId: string): Promise<WeeklySummary | null> {
  const { data, error } = await supabase
    .from('weekly_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching latest summary:', error);
    return null;
  }

  return data;
}

export async function markSummaryAsSent(summaryId: string): Promise<void> {
  const { error } = await supabase
    .from('weekly_summaries')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', summaryId);

  if (error) {
    console.error('Error marking summary as sent:', error);
  }
}

export function formatWeeklySummaryMessage(summary: WeeklySummary): string {
  const weekStart = new Date(summary.week_start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const weekEnd = new Date(summary.week_end).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const topDishesText =
    summary.top_dishes.length > 0
      ? summary.top_dishes.map((d, i) => `${i + 1}. ${d.name} (${d.count}x)`).join('\n')
      : 'No meals logged this week';

  return `
🎉 Your Weekly Nutrition Recap
${weekStart} - ${weekEnd}

📊 Total Calories: ${Math.round(summary.total_calories).toLocaleString()}
📈 Avg Daily: ${Math.round(summary.avg_daily_calories)} cal
✅ Compliance: ${summary.compliance_percentage}%

🍽️ Top Dishes:
${topDishesText}

💡 Tip: ${summary.tip}

Keep up the great work! 💪
  `.trim();
}

export function shouldGenerateSummary(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  return dayOfWeek === 0 && hour === 20;
}
