/*
  # Add Personalization & Memory Schema - Phase 3

  ## Overview
  Adds tables and functions for tracking user patterns, repeat meals, and personalized priors.
  
  ## New Tables
  
  ### 1. user_meal_patterns
  Tracks frequently logged food combinations for quick suggestions
  - user_id, meal_combination (jsonb), frequency, last_logged_at
  
  ### 2. user_portion_priors
  Stores user-specific typical portions per food item
  - user_id, food_name, avg_portion_grams, count, updated_at
  
  ### 3. multilingual_synonyms
  Maps Hindi/regional terms to canonical English names
  - local_term, canonical_name, language, region, category
  
  ## Security
  - RLS enabled on all user-specific tables
  - Public read access for multilingual_synonyms
*/

-- user_meal_patterns: Track frequent meal combinations
CREATE TABLE IF NOT EXISTS user_meal_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_combination jsonb NOT NULL,
  frequency int DEFAULT 1,
  last_logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, meal_combination)
);

CREATE INDEX IF NOT EXISTS idx_user_meal_patterns_user_id ON user_meal_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meal_patterns_frequency ON user_meal_patterns(frequency DESC);

-- user_portion_priors: Learn user-specific portions
CREATE TABLE IF NOT EXISTS user_portion_priors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  avg_portion_grams numeric NOT NULL,
  sample_count int DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, food_name)
);

CREATE INDEX IF NOT EXISTS idx_user_portion_priors_user_id ON user_portion_priors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_portion_priors_food_name ON user_portion_priors(food_name);

-- multilingual_synonyms: Hindi/regional term mapping
CREATE TABLE IF NOT EXISTS multilingual_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  local_term text NOT NULL,
  canonical_name text NOT NULL,
  language text NOT NULL,
  region text,
  category text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(local_term, language)
);

CREATE INDEX IF NOT EXISTS idx_multilingual_synonyms_term ON multilingual_synonyms(local_term);
CREATE INDEX IF NOT EXISTS idx_multilingual_synonyms_lang ON multilingual_synonyms(language);

-- Enable RLS
ALTER TABLE user_meal_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_portion_priors ENABLE ROW LEVEL SECURITY;
ALTER TABLE multilingual_synonyms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_meal_patterns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_meal_patterns' AND policyname = 'Users can view own patterns'
  ) THEN
    CREATE POLICY "Users can view own patterns"
      ON user_meal_patterns FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_meal_patterns' AND policyname = 'Users can insert own patterns'
  ) THEN
    CREATE POLICY "Users can insert own patterns"
      ON user_meal_patterns FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_meal_patterns' AND policyname = 'Users can update own patterns'
  ) THEN
    CREATE POLICY "Users can update own patterns"
      ON user_meal_patterns FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for user_portion_priors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_portion_priors' AND policyname = 'Users can view own priors'
  ) THEN
    CREATE POLICY "Users can view own priors"
      ON user_portion_priors FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_portion_priors' AND policyname = 'Users can manage own priors'
  ) THEN
    CREATE POLICY "Users can manage own priors"
      ON user_portion_priors FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for multilingual_synonyms (public read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'multilingual_synonyms' AND policyname = 'Public can read synonyms'
  ) THEN
    CREATE POLICY "Public can read synonyms"
      ON multilingual_synonyms FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Function to update meal pattern
CREATE OR REPLACE FUNCTION upsert_meal_pattern(
  p_meal_combination jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_meal_patterns (user_id, meal_combination, frequency, last_logged_at)
  VALUES (auth.uid(), p_meal_combination, 1, now())
  ON CONFLICT (user_id, meal_combination)
  DO UPDATE SET
    frequency = user_meal_patterns.frequency + 1,
    last_logged_at = now();
END;
$$;

-- Function to update portion prior
CREATE OR REPLACE FUNCTION update_portion_prior(
  p_food_name text,
  p_portion_grams numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_avg numeric;
  v_current_count int;
BEGIN
  SELECT avg_portion_grams, sample_count
  INTO v_current_avg, v_current_count
  FROM user_portion_priors
  WHERE user_id = auth.uid() AND food_name = p_food_name;
  
  IF v_current_avg IS NULL THEN
    INSERT INTO user_portion_priors (user_id, food_name, avg_portion_grams, sample_count)
    VALUES (auth.uid(), p_food_name, p_portion_grams, 1);
  ELSE
    UPDATE user_portion_priors
    SET
      avg_portion_grams = ((v_current_avg * v_current_count) + p_portion_grams) / (v_current_count + 1),
      sample_count = v_current_count + 1,
      updated_at = now()
    WHERE user_id = auth.uid() AND food_name = p_food_name;
  END IF;
END;
$$;

-- Seed multilingual synonyms (Hindi/Indian terms)
INSERT INTO multilingual_synonyms (local_term, canonical_name, language, region, category) VALUES
  ('रोटी', 'roti', 'hi', 'North India', 'bread'),
  ('chapati', 'roti', 'hi', 'North India', 'bread'),
  ('कटोरी', 'katori', 'hi', 'North India', 'unit'),
  ('katori', 'bowl', 'hi', 'North India', 'unit'),
  ('कप', 'cup', 'hi', 'North India', 'unit'),
  ('प्याला', 'cup', 'hi', 'North India', 'unit'),
  ('अंडा', 'egg', 'hi', 'North India', 'protein'),
  ('anda', 'egg', 'hi', 'North India', 'protein'),
  ('दाल', 'dal', 'hi', 'North India', 'lentils'),
  ('चावल', 'rice', 'hi', 'North India', 'grain'),
  ('chawal', 'rice', 'hi', 'North India', 'grain'),
  ('सब्जी', 'sabzi', 'hi', 'North India', 'vegetable'),
  ('sabji', 'sabzi', 'hi', 'North India', 'vegetable'),
  ('परांठा', 'paratha', 'hi', 'North India', 'bread'),
  ('इडली', 'idli', 'hi', 'South India', 'breakfast'),
  ('डोसा', 'dosa', 'hi', 'South India', 'breakfast'),
  ('छोटा', 'small', 'hi', 'North India', 'size'),
  ('chota', 'small', 'hi', 'North India', 'size'),
  ('बड़ा', 'large', 'hi', 'North India', 'size'),
  ('bada', 'large', 'hi', 'North India', 'size')
ON CONFLICT (local_term, language) DO NOTHING;

COMMENT ON TABLE user_meal_patterns IS 'Tracks frequently logged meal combinations for quick suggestions';
COMMENT ON TABLE user_portion_priors IS 'Learns user-specific typical portions per food item';
COMMENT ON TABLE multilingual_synonyms IS 'Maps Hindi/regional terms to canonical English food names';
