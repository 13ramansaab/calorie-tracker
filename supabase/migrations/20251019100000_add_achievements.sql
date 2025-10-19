/*
  # Add Achievements System

  1. New Tables
    - `achievements`
      - `id` (text, primary key) - achievement identifier
      - `name` (text)
      - `description` (text)
      - `icon` (text) - emoji or icon name
      - `tier` (text) - bronze, silver, gold, platinum

    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `achievement_id` (text, references achievements)
      - `earned_at` (timestamptz)
      - `progress` (integer) - for multi-level achievements

  2. Security
    - Enable RLS on both tables
    - Achievements table is publicly readable
    - Users can only view their own earned achievements

  3. Pre-populated Achievements
    - Streak achievements (3, 7, 14, 30 days)
    - First photo
    - First week complete
*/

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  tier text CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')) DEFAULT 'bronze',
  requirement_value integer,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id text REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  progress integer DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (publicly readable)
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO achievements (id, name, description, icon, tier, requirement_value) VALUES
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
  v_achievement_id text;
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
  SELECT COUNT(*) INTO v_current_streak
  FROM streak_calc
  WHERE grp = (SELECT grp FROM streak_calc ORDER BY log_date DESC LIMIT 1);

  -- Award streak achievements
  FOR v_achievement_id IN
    SELECT id FROM achievements
    WHERE id LIKE 'streak_%'
      AND requirement_value <= v_current_streak
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements
        WHERE user_id = p_user_id AND achievement_id = achievements.id
      )
  LOOP
    INSERT INTO user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement_id, v_current_streak)
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
  v_achievement_id text;
BEGIN
  -- Count total meals logged
  SELECT COUNT(*) INTO v_meal_count
  FROM meal_logs
  WHERE user_id = p_user_id;

  -- Award meal count achievements
  FOR v_achievement_id IN
    SELECT id FROM achievements
    WHERE id LIKE 'meal_%'
      AND requirement_value <= v_meal_count
      AND NOT EXISTS (
        SELECT 1 FROM user_achievements
        WHERE user_id = p_user_id AND achievement_id = achievements.id
      )
  LOOP
    INSERT INTO user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement_id, v_meal_count)
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;
