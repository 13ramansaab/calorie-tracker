/*
  # Add Usage Gating and Daily Totals

  ## Overview
  Implements feature gating with usage counters and precomputed daily totals for charts

  ## 1. New Tables

  ### daily_totals
  Precomputed daily aggregates for fast chart rendering
  - user_id, date, total_calories, total_protein, total_carbs, total_fat
  - meal_count, avg_calories_per_meal
  - Unique constraint on (user_id, date)

  ## 2. Modifications

  ### usage_tracking
  Enhanced with:
  - vision_daily_used (photo analyses count)
  - chat_daily_used (AI chat messages count)
  - last_reset_at (timestamp of last midnight reset)
  - timezone (user's timezone for correct midnight calculation)

  ### subscriptions
  New table for subscription lifecycle tracking
  - user_id, status (trialing, active, canceled, past_due)
  - trial_start, trial_end, period_end
  - payment_failed_at, canceled_at
  - stripe_subscription_id, stripe_customer_id

  ## 3. Functions

  ### reset_daily_usage()
  Called at midnight (user timezone) to reset daily counters

  ### can_use_feature()
  Check if user has quota remaining for a feature

  ### update_daily_totals()
  Recompute daily totals when meal is added/edited/deleted

  ## 4. Triggers

  Automatically update daily_totals on meal_log changes

  ## 5. Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Create daily_totals table for precomputed aggregates
CREATE TABLE IF NOT EXISTS daily_totals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_calories numeric DEFAULT 0,
  total_protein numeric DEFAULT 0,
  total_carbs numeric DEFAULT 0,
  total_fat numeric DEFAULT 0,
  meal_count integer DEFAULT 0,
  avg_calories_per_meal numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Add indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_daily_totals_user_date ON daily_totals(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_totals_date ON daily_totals(date DESC);

-- Enhance usage_tracking with reset tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'vision_daily_used') THEN
    ALTER TABLE usage_tracking ADD COLUMN vision_daily_used integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'chat_daily_used') THEN
    ALTER TABLE usage_tracking ADD COLUMN chat_daily_used integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'last_reset_at') THEN
    ALTER TABLE usage_tracking ADD COLUMN last_reset_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'timezone') THEN
    ALTER TABLE usage_tracking ADD COLUMN timezone text DEFAULT 'UTC';
  END IF;
END $$;

-- Rename existing columns to match new naming
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'photo_analyses') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'vision_daily_used') THEN
      ALTER TABLE usage_tracking RENAME COLUMN photo_analyses TO vision_daily_used;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'ai_chat_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_tracking' AND column_name = 'chat_daily_used') THEN
      ALTER TABLE usage_tracking RENAME COLUMN ai_chat_messages TO chat_daily_used;
    END IF;
  END IF;
END $$;

-- Create subscriptions table for lifecycle management
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status text CHECK (status IN ('trialing', 'active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid')) NOT NULL DEFAULT 'trialing',
  tier text CHECK (tier IN ('free', 'premium', 'lifetime')) NOT NULL DEFAULT 'free',
  trial_start timestamptz,
  trial_end timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  payment_failed_at timestamptz,
  canceled_at timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  stripe_price_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- Function to reset daily usage counters
CREATE OR REPLACE FUNCTION reset_daily_usage(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE usage_tracking
  SET
    vision_daily_used = 0,
    chat_daily_used = 0,
    last_reset_at = now()
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;

  IF NOT FOUND THEN
    INSERT INTO usage_tracking (user_id, date, vision_daily_used, chat_daily_used, last_reset_at)
    VALUES (p_user_id, CURRENT_DATE, 0, 0, now())
    ON CONFLICT (user_id, date) DO UPDATE
    SET
      vision_daily_used = 0,
      chat_daily_used = 0,
      last_reset_at = now();
  END IF;
END;
$$;

-- Function to check if user can use a feature
CREATE OR REPLACE FUNCTION can_use_feature(
  p_user_id uuid,
  p_feature text
)
RETURNS TABLE (
  allowed boolean,
  current_usage integer,
  limit_value integer,
  is_premium boolean
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tier text;
  v_usage integer;
  v_limit integer;
BEGIN
  SELECT COALESCE(tier, 'free')
  INTO v_tier
  FROM subscriptions
  WHERE user_id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'free';
  END IF;

  IF v_tier IN ('premium', 'lifetime') THEN
    RETURN QUERY SELECT true, 0, 999999, true;
    RETURN;
  END IF;

  IF p_feature = 'vision_daily' THEN
    v_limit := 1;

    SELECT COALESCE(vision_daily_used, 0)
    INTO v_usage
    FROM usage_tracking
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    v_usage := COALESCE(v_usage, 0);

    RETURN QUERY SELECT (v_usage < v_limit), v_usage, v_limit, false;
  ELSIF p_feature = 'chat_daily' THEN
    v_limit := 5;

    SELECT COALESCE(chat_daily_used, 0)
    INTO v_usage
    FROM usage_tracking
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    v_usage := COALESCE(v_usage, 0);

    RETURN QUERY SELECT (v_usage < v_limit), v_usage, v_limit, false;
  ELSE
    RETURN QUERY SELECT true, 0, 999999, false;
  END IF;
END;
$$;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id uuid,
  p_feature text
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_count integer;
BEGIN
  IF p_feature = 'vision_daily' THEN
    INSERT INTO usage_tracking (user_id, date, vision_daily_used, last_reset_at)
    VALUES (p_user_id, CURRENT_DATE, 1, now())
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      vision_daily_used = usage_tracking.vision_daily_used + 1
    RETURNING vision_daily_used INTO v_new_count;
  ELSIF p_feature = 'chat_daily' THEN
    INSERT INTO usage_tracking (user_id, date, chat_daily_used, last_reset_at)
    VALUES (p_user_id, CURRENT_DATE, 1, now())
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      chat_daily_used = usage_tracking.chat_daily_used + 1
    RETURNING chat_daily_used INTO v_new_count;
  ELSE
    v_new_count := 0;
  END IF;

  RETURN v_new_count;
END;
$$;

-- Function to update daily totals
CREATE OR REPLACE FUNCTION update_daily_totals_for_user(
  p_user_id uuid,
  p_date date
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_calories numeric;
  v_total_protein numeric;
  v_total_carbs numeric;
  v_total_fat numeric;
  v_meal_count integer;
BEGIN
  SELECT
    COALESCE(SUM(total_calories), 0),
    COALESCE(SUM(total_protein), 0),
    COALESCE(SUM(total_carbs), 0),
    COALESCE(SUM(total_fat), 0),
    COUNT(*)
  INTO
    v_total_calories,
    v_total_protein,
    v_total_carbs,
    v_total_fat,
    v_meal_count
  FROM meal_logs
  WHERE user_id = p_user_id
    AND DATE(logged_at) = p_date;

  INSERT INTO daily_totals (
    user_id,
    date,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    meal_count,
    avg_calories_per_meal,
    updated_at
  )
  VALUES (
    p_user_id,
    p_date,
    v_total_calories,
    v_total_protein,
    v_total_carbs,
    v_total_fat,
    v_meal_count,
    CASE WHEN v_meal_count > 0 THEN v_total_calories / v_meal_count ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_calories = v_total_calories,
    total_protein = v_total_protein,
    total_carbs = v_total_carbs,
    total_fat = v_total_fat,
    meal_count = v_meal_count,
    avg_calories_per_meal = CASE WHEN v_meal_count > 0 THEN v_total_calories / v_meal_count ELSE 0 END,
    updated_at = now();
END;
$$;

-- Trigger to update daily totals on meal changes
CREATE OR REPLACE FUNCTION trigger_update_daily_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_daily_totals_for_user(NEW.user_id, DATE(NEW.logged_at));
  END IF;

  IF TG_OP = 'DELETE' THEN
    PERFORM update_daily_totals_for_user(OLD.user_id, DATE(OLD.logged_at));
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS meal_logs_update_daily_totals ON meal_logs;
CREATE TRIGGER meal_logs_update_daily_totals
  AFTER INSERT OR UPDATE OR DELETE ON meal_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_daily_totals();

-- Enable RLS
ALTER TABLE daily_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_totals
CREATE POLICY "Users can view own daily totals"
  ON daily_totals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily totals"
  ON daily_totals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily totals"
  ON daily_totals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE daily_totals IS 'Precomputed daily nutrition totals for fast chart rendering';
COMMENT ON TABLE subscriptions IS 'Subscription lifecycle management with trial and payment tracking';
COMMENT ON FUNCTION can_use_feature IS 'Check if user has remaining quota for a feature (respects premium tier)';
COMMENT ON FUNCTION increment_usage IS 'Increment usage counter for a feature';
COMMENT ON FUNCTION reset_daily_usage IS 'Reset daily usage counters at midnight';
COMMENT ON FUNCTION update_daily_totals_for_user IS 'Recompute daily totals for a specific user and date';
