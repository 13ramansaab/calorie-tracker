/*
  # Extend Schema for Nutrition Tracking App

  ## Overview
  Extends existing schema to match the data model design requirements.
  Adds missing columns to existing tables and creates new tables for complete functionality.

  ## 1. Table Modifications

  ### profiles
  - Add demographics fields (date_of_birth, gender, height, weight, goals)
  - Add activity_level and locale
  - Add preferences jsonb field

  ### food_items
  - Add Indian food specific fields (name_local, region, category)
  - Add fiber_per_100g
  - Add typical_portion_grams and portion_names
  - Add image_urls and tags as jsonb
  - Add search_vector for full-text search
  - Add is_active flag

  ### meal_logs
  - Add source field (manual/photo/ai)
  - Add photo_analysis_id reference
  - Add total nutrition fields
  - Add updated_at timestamp

  ### meal_log_items
  - Add name_snapshot for denormalization
  - Add portion_description
  - Add fiber tracking
  - Add confidence_score for AI

  ## 2. New Tables

  ### subscriptions
  Replaces subscription_status with more detailed subscription management

  ### payments
  Transaction history for payment tracking

  ### recipes
  Premium recipe content

  ### photo_analyses
  AI photo analysis results

  ### goals
  Replaces user_goals with more flexible goal tracking

  ### achievements
  Gamification badges and streaks

  ### reports
  Precomputed analytics reports

  ### system_configs
  App configuration and feature flags

  ## 3. Security
  Enable RLS and create policies for all new tables
*/

-- Add missing columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE profiles ADD COLUMN gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'height_cm') THEN
    ALTER TABLE profiles ADD COLUMN height_cm numeric CHECK (height_cm > 0 AND height_cm < 300);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_weight_kg') THEN
    ALTER TABLE profiles ADD COLUMN current_weight_kg numeric CHECK (current_weight_kg > 0 AND current_weight_kg < 500);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goal_weight_kg') THEN
    ALTER TABLE profiles ADD COLUMN goal_weight_kg numeric CHECK (goal_weight_kg > 0 AND goal_weight_kg < 500);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'activity_level') THEN
    ALTER TABLE profiles ADD COLUMN activity_level text CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')) DEFAULT 'moderate';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'locale') THEN
    ALTER TABLE profiles ADD COLUMN locale text DEFAULT 'en-IN';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
    ALTER TABLE profiles ADD COLUMN preferences jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add missing columns to food_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'name_local') THEN
    ALTER TABLE food_items ADD COLUMN name_local text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'region') THEN
    ALTER TABLE food_items ADD COLUMN region text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'category') THEN
    ALTER TABLE food_items ADD COLUMN category text CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'beverage'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'fiber_per_100g') THEN
    ALTER TABLE food_items ADD COLUMN fiber_per_100g numeric DEFAULT 0 CHECK (fiber_per_100g >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'typical_portion_grams') THEN
    ALTER TABLE food_items ADD COLUMN typical_portion_grams numeric CHECK (typical_portion_grams > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'portion_names') THEN
    ALTER TABLE food_items ADD COLUMN portion_names jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'image_urls') THEN
    ALTER TABLE food_items ADD COLUMN image_urls jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'tags') THEN
    ALTER TABLE food_items ADD COLUMN tags jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'search_vector') THEN
    ALTER TABLE food_items ADD COLUMN search_vector tsvector;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'is_active') THEN
    ALTER TABLE food_items ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'food_items' AND column_name = 'updated_at') THEN
    ALTER TABLE food_items ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing columns to meal_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'source') THEN
    ALTER TABLE meal_logs ADD COLUMN source text CHECK (source IN ('manual', 'photo', 'ai')) DEFAULT 'manual';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'total_calories') THEN
    ALTER TABLE meal_logs ADD COLUMN total_calories numeric DEFAULT 0 CHECK (total_calories >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'total_protein') THEN
    ALTER TABLE meal_logs ADD COLUMN total_protein numeric DEFAULT 0 CHECK (total_protein >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'total_carbs') THEN
    ALTER TABLE meal_logs ADD COLUMN total_carbs numeric DEFAULT 0 CHECK (total_carbs >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'total_fat') THEN
    ALTER TABLE meal_logs ADD COLUMN total_fat numeric DEFAULT 0 CHECK (total_fat >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'total_fiber') THEN
    ALTER TABLE meal_logs ADD COLUMN total_fiber numeric DEFAULT 0 CHECK (total_fiber >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'updated_at') THEN
    ALTER TABLE meal_logs ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing columns to meal_log_items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_log_items' AND column_name = 'name_snapshot') THEN
    ALTER TABLE meal_log_items ADD COLUMN name_snapshot text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_log_items' AND column_name = 'portion_description') THEN
    ALTER TABLE meal_log_items ADD COLUMN portion_description text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_log_items' AND column_name = 'fiber') THEN
    ALTER TABLE meal_log_items ADD COLUMN fiber numeric DEFAULT 0 CHECK (fiber >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_log_items' AND column_name = 'confidence_score') THEN
    ALTER TABLE meal_log_items ADD COLUMN confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1);
  END IF;
END $$;

-- Rename quantity_grams to portion_grams in meal_log_items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_log_items' AND column_name = 'quantity_grams') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_log_items' AND column_name = 'portion_grams') THEN
      ALTER TABLE meal_log_items RENAME COLUMN quantity_grams TO portion_grams;
    END IF;
  END IF;
END $$;

-- Create photo_analyses table
CREATE TABLE IF NOT EXISTS photo_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  detected_dishes jsonb DEFAULT '[]',
  overall_confidence numeric CHECK (overall_confidence >= 0 AND overall_confidence <= 1),
  ai_model_version text,
  feedback_flag text CHECK (feedback_flag IN ('correct', 'incorrect', 'partially_correct')),
  feedback_notes text,
  status text CHECK (status IN ('pending', 'analyzed', 'confirmed', 'rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Add photo_analysis_id to meal_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meal_logs' AND column_name = 'photo_analysis_id') THEN
    ALTER TABLE meal_logs ADD COLUMN photo_analysis_id uuid REFERENCES photo_analyses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create subscriptions table (enhanced version of subscription_status)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan text CHECK (plan IN ('free', 'trial', 'premium_monthly', 'premium_yearly')) DEFAULT 'free',
  status text CHECK (status IN ('active', 'canceled', 'expired', 'past_due')) DEFAULT 'active',
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  provider text,
  provider_subscription_id text,
  provider_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'INR',
  status text CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
  provider text,
  provider_payment_id text,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  prep_time_minutes integer CHECK (prep_time_minutes >= 0),
  cook_time_minutes integer CHECK (cook_time_minutes >= 0),
  servings integer CHECK (servings > 0),
  ingredients jsonb DEFAULT '[]',
  steps jsonb DEFAULT '[]',
  nutrition_per_serving jsonb DEFAULT '{}',
  tags jsonb DEFAULT '[]',
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_premium boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create goals table (enhanced version of user_goals)
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  daily_calorie_target numeric CHECK (daily_calorie_target > 0),
  protein_target_grams numeric DEFAULT 0 CHECK (protein_target_grams >= 0),
  carbs_target_grams numeric DEFAULT 0 CHECK (carbs_target_grams >= 0),
  fat_target_grams numeric DEFAULT 0 CHECK (fat_target_grams >= 0),
  fiber_target_grams numeric DEFAULT 0 CHECK (fiber_target_grams >= 0),
  macro_ratio jsonb DEFAULT '{}',
  effective_from date NOT NULL,
  effective_until date,
  created_at timestamptz DEFAULT now()
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  report_type text CHECK (report_type IN ('weekly', 'monthly')) NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  summary jsonb DEFAULT '{}',
  export_url text,
  created_at timestamptz DEFAULT now()
);

-- Create system_configs table
CREATE TABLE IF NOT EXISTS system_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_items_active ON food_items(is_active);
CREATE INDEX IF NOT EXISTS idx_food_items_search_vector ON food_items USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_photo_analyses_user ON photo_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_effective ON goals(user_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_period ON reports(user_id, period_start DESC);

-- Create function to update search_vector for food_items
CREATE OR REPLACE FUNCTION update_food_items_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.name_local, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search_vector updates
DROP TRIGGER IF EXISTS food_items_search_vector_update ON food_items;
CREATE TRIGGER food_items_search_vector_update
  BEFORE INSERT OR UPDATE ON food_items
  FOR EACH ROW
  EXECUTE FUNCTION update_food_items_search_vector();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on new tables
DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS food_items_updated_at ON food_items;
CREATE TRIGGER food_items_updated_at BEFORE UPDATE ON food_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS meal_logs_updated_at ON meal_logs;
CREATE TRIGGER meal_logs_updated_at BEFORE UPDATE ON meal_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on new tables
ALTER TABLE photo_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for photo_analyses
CREATE POLICY "Users can view own photo analyses"
  ON photo_analyses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own photo analyses"
  ON photo_analyses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own photo analyses"
  ON photo_analyses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for payments
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for recipes
CREATE POLICY "Users can view recipes based on subscription"
  ON recipes FOR SELECT
  TO authenticated
  USING (
    NOT is_premium OR EXISTS (
      SELECT 1 FROM subscriptions
      WHERE subscriptions.user_id = auth.uid()
      AND subscriptions.status = 'active'
      AND subscriptions.plan IN ('premium_monthly', 'premium_yearly', 'trial')
      AND (
        subscriptions.plan != 'trial'
        OR (subscriptions.trial_end_date IS NULL OR subscriptions.trial_end_date > now())
      )
    )
  );

-- RLS Policies for goals
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals"
  ON goals FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
  ON goals FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for achievements
CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for reports
CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reports"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for system_configs (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view system configs"
  ON system_configs FOR SELECT
  TO authenticated
  USING (true);