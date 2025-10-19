/*
  # Add Achievement Badges and Weekly Summaries

  1. New Tables
    - `achievement_badges` - Catalog of available achievements
    - `weekly_summaries` already created in previous migration

  2. Updates
    - Populate achievement_badges with default achievements
    - Update existing achievements table to use badge_id references

  3. Functions
    - Streak and meal count achievement checkers
*/

-- Create achievement_badges table (catalog)
CREATE TABLE IF NOT EXISTS achievement_badges (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  tier text CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
  requirement_value integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on achievement_badges
ALTER TABLE achievement_badges ENABLE ROW LEVEL SECURITY;

-- Make badges publicly viewable
CREATE POLICY "Achievement badges are viewable by everyone"
  ON achievement_badges FOR SELECT
  TO authenticated
  USING (true);

-- Insert default achievement badges
INSERT INTO achievement_badges (id, name, description, icon, tier, requirement_value) VALUES
  ('streak_3', '3-Day Streak', 'Log meals for 3 consecutive days', '🔥', 'bronze', 3),
  ('streak_7', 'Week Warrior', 'Log meals for 7 consecutive days', '💪', 'silver', 7),
  ('streak_14', 'Two Week Champion', 'Log meals for 14 consecutive days', '⭐', 'gold', 14),
  ('streak_30', 'Month Master', 'Log meals for 30 consecutive days', '👑', 'platinum', 30),
  ('first_photo', 'First Snap', 'Log your first meal with a photo', '📸', 'bronze', 1),
  ('first_week', 'Week Complete', 'Complete your first full week of logging', '✅', 'silver', 1),
  ('meal_10', 'Getting Started', 'Log 10 meals', '🍽️', 'bronze', 10),
  ('meal_50', 'Dedicated Tracker', 'Log 50 meals', '📊', 'silver', 50),
  ('meal_100', 'Century Club', 'Log 100 meals', '💯', 'gold', 100),
  ('meal_500', 'Nutrition Legend', 'Log 500 meals', '🏆', 'platinum', 500)
ON CONFLICT (id) DO NOTHING;

-- Function to check and award streak achievements
CREATE OR REPLACE FUNCTION check_streak_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_streak integer;
  v_badge_id text;
BEGIN
  -- Calculate current streak
  WITH daily_logs AS (
    SELECT DISTINCT DATE(logged_at) as log_date
    FROM meal_logs
    WHERE user_id = p_user_id
    ORDER BY log_date DESC
  ),
  streak_calc AS (
    SELECT
      log_date,
      ROW_NUMBER() OVER (ORDER BY log_date DESC) as rn,
      log_date - (ROW_NUMBER() OVER (ORDER BY log_date DESC) * INTERVAL '1 day') as grp
    FROM daily_logs
  )
  SELECT COALESCE(COUNT(*), 0) INTO v_current_streak
  FROM streak_calc
  WHERE grp = (SELECT grp FROM streak_calc ORDER BY log_date DESC LIMIT 1);

  -- Award streak achievements
  FOR v_badge_id IN
    SELECT id FROM achievement_badges
    WHERE id LIKE 'streak_%'
      AND requirement_value <= v_current_streak
      AND NOT EXISTS (
        SELECT 1 FROM achievements
        WHERE user_id = p_user_id AND badge_id = achievement_badges.id
      )
  LOOP
    INSERT INTO achievements (user_id, badge_id, metadata)
    VALUES (p_user_id, v_badge_id, jsonb_build_object('streak_length', v_current_streak))
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- Function to check meal count achievements
CREATE OR REPLACE FUNCTION check_meal_achievements(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meal_count integer;
  v_badge_id text;
BEGIN
  -- Count total meals logged
  SELECT COUNT(*) INTO v_meal_count
  FROM meal_logs
  WHERE user_id = p_user_id;

  -- Award meal count achievements
  FOR v_badge_id IN
    SELECT id FROM achievement_badges
    WHERE id LIKE 'meal_%'
      AND requirement_value <= v_meal_count
      AND NOT EXISTS (
        SELECT 1 FROM achievements
        WHERE user_id = p_user_id AND badge_id = achievement_badges.id
      )
  LOOP
    INSERT INTO achievements (user_id, badge_id, metadata)
    VALUES (p_user_id, v_badge_id, jsonb_build_object('meal_count', v_meal_count))
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
