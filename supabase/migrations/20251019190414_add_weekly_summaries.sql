/*
  # Add Weekly Summaries and Scheduled Jobs

  1. New Tables
    - `weekly_summaries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `week_start` (date)
      - `week_end` (date)
      - `total_calories` (numeric)
      - `avg_daily_calories` (numeric)
      - `compliance_percentage` (numeric)
      - `top_dishes` (jsonb array of {name, count})
      - `tip` (text)
      - `created_at` (timestamptz)
      - `sent_at` (timestamptz)

  2. Security
    - Enable RLS on `weekly_summaries`
    - Users can only view their own summaries

  3. Indexes
    - Index on user_id and week_start for fast lookups
*/

-- Create weekly_summaries table
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_calories numeric NOT NULL DEFAULT 0,
  avg_daily_calories numeric NOT NULL DEFAULT 0,
  compliance_percentage numeric NOT NULL DEFAULT 0 CHECK (compliance_percentage >= 0 AND compliance_percentage <= 100),
  top_dishes jsonb DEFAULT '[]',
  tip text,
  created_at timestamptz DEFAULT now() NOT NULL,
  sent_at timestamptz,
  UNIQUE(user_id, week_start)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_id ON weekly_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_week_start ON weekly_summaries(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_user_week ON weekly_summaries(user_id, week_start DESC);

-- Enable RLS
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own weekly summaries"
  ON weekly_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to generate weekly summary for a user
CREATE OR REPLACE FUNCTION generate_weekly_summary(p_user_id uuid, p_week_start date, p_week_end date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_calories numeric;
  v_avg_daily_calories numeric;
  v_goal_calories numeric;
  v_compliance_percentage numeric;
  v_top_dishes jsonb;
  v_days_with_logs integer;
  v_result jsonb;
BEGIN
  -- Get user's calorie goal
  SELECT COALESCE(daily_calorie_target, 2000) INTO v_goal_calories
  FROM goals
  WHERE user_id = p_user_id
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Calculate total calories and days logged
  SELECT
    COALESCE(SUM(total_calories), 0),
    COUNT(DISTINCT DATE(logged_at))
  INTO v_total_calories, v_days_with_logs
  FROM meal_logs
  WHERE user_id = p_user_id
    AND DATE(logged_at) BETWEEN p_week_start AND p_week_end;

  -- Calculate average daily calories (over 7 days, not just logged days)
  v_avg_daily_calories := v_total_calories / 7;

  -- Calculate compliance percentage (days within ±200 cal of goal)
  WITH daily_totals AS (
    SELECT
      DATE(logged_at) as log_date,
      SUM(total_calories) as daily_total
    FROM meal_logs
    WHERE user_id = p_user_id
      AND DATE(logged_at) BETWEEN p_week_start AND p_week_end
    GROUP BY DATE(logged_at)
  )
  SELECT
    ROUND((COUNT(*) FILTER (WHERE ABS(daily_total - v_goal_calories) <= 200)::numeric / 7 * 100), 1)
  INTO v_compliance_percentage
  FROM daily_totals;

  -- Get top 3 dishes
  WITH meal_items_with_names AS (
    SELECT
      mli.food_name,
      COUNT(*) as frequency
    FROM meal_logs ml
    JOIN meal_log_items mli ON ml.id = mli.meal_log_id
    WHERE ml.user_id = p_user_id
      AND DATE(ml.logged_at) BETWEEN p_week_start AND p_week_end
    GROUP BY mli.food_name
    ORDER BY frequency DESC
    LIMIT 3
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object('name', food_name, 'count', frequency)), '[]'::jsonb)
  INTO v_top_dishes
  FROM meal_items_with_names;

  -- Build result
  v_result := jsonb_build_object(
    'total_calories', v_total_calories,
    'avg_daily_calories', ROUND(v_avg_daily_calories, 0),
    'compliance_percentage', COALESCE(v_compliance_percentage, 0),
    'top_dishes', v_top_dishes,
    'days_logged', v_days_with_logs,
    'goal_calories', v_goal_calories
  );

  RETURN v_result;
END;
$$;
