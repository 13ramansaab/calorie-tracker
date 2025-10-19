/*
  # Add AI-Specific Tables and Fields

  ## Overview
  Extends schema with AI-focused collections for photo analysis, learning loops,
  usage tracking, and user-specific AI priors.

  ## 1. New Tables

  ### ai_corrections
  Stores user corrections to AI predictions for learning loop

  ### dish_synonyms
  Canonical name mapping for regional food name variations

  ### user_priors
  User-specific meal patterns and portion preferences

  ### usage_tracking
  Daily usage counters for free tier limits

  ## 2. Modifications

  ### photo_analyses
  Add fields: source, model_version, raw_response, latency_ms, feedback

  ## 3. Security
  Enable RLS and create policies for all tables
*/

-- Extend photo_analyses table with AI-specific fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_analyses' AND column_name = 'source') THEN
    ALTER TABLE photo_analyses ADD COLUMN source text CHECK (source IN ('camera', 'gallery')) DEFAULT 'camera';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_analyses' AND column_name = 'model_version') THEN
    ALTER TABLE photo_analyses ADD COLUMN model_version text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_analyses' AND column_name = 'raw_response') THEN
    ALTER TABLE photo_analyses ADD COLUMN raw_response jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_analyses' AND column_name = 'latency_ms') THEN
    ALTER TABLE photo_analyses ADD COLUMN latency_ms integer CHECK (latency_ms >= 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_analyses' AND column_name = 'feedback') THEN
    ALTER TABLE photo_analyses ADD COLUMN feedback jsonb DEFAULT '[]';
  END IF;
END $$;

-- Rename ai_model_version to match expected field name
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_analyses' AND column_name = 'ai_model_version') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'photo_analyses' AND column_name = 'model_version') THEN
      ALTER TABLE photo_analyses RENAME COLUMN ai_model_version TO model_version;
    END IF;
  END IF;
END $$;

-- Create ai_corrections table for learning loop
CREATE TABLE IF NOT EXISTS ai_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES photo_analyses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  original_name text NOT NULL,
  corrected_name text NOT NULL,
  original_portion numeric NOT NULL,
  corrected_portion numeric NOT NULL,
  original_calories numeric NOT NULL,
  corrected_calories numeric NOT NULL,
  correction_type text CHECK (correction_type IN ('name', 'portion', 'macros', 'all')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create dish_synonyms table for regional variations
CREATE TABLE IF NOT EXISTS dish_synonyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name text NOT NULL,
  synonyms jsonb DEFAULT '[]' NOT NULL,
  region text,
  tags jsonb DEFAULT '[]',
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_priors table for personalized AI
CREATE TABLE IF NOT EXISTS user_priors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  common_dishes jsonb DEFAULT '[]',
  typical_portions jsonb DEFAULT '{}',
  time_of_day_bias jsonb DEFAULT '{}',
  dietary_context jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

-- Create usage_tracking table for quota management
CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  photo_analyses integer DEFAULT 0 CHECK (photo_analyses >= 0),
  text_analyses integer DEFAULT 0 CHECK (text_analyses >= 0),
  ai_chat_messages integer DEFAULT 0 CHECK (ai_chat_messages >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_corrections_user ON ai_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_analysis ON ai_corrections(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_created ON ai_corrections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dish_synonyms_canonical ON dish_synonyms(canonical_name);
CREATE INDEX IF NOT EXISTS idx_dish_synonyms_region ON dish_synonyms(region);
CREATE INDEX IF NOT EXISTS idx_user_priors_user ON user_priors(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_date ON usage_tracking(user_id, date DESC);

-- Add unique constraint to user_priors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_priors_user_id_key' 
    AND conrelid = 'user_priors'::regclass
  ) THEN
    ALTER TABLE user_priors ADD CONSTRAINT user_priors_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Create function to update dish_synonyms updated_at
DROP TRIGGER IF EXISTS dish_synonyms_updated_at ON dish_synonyms;
CREATE TRIGGER dish_synonyms_updated_at BEFORE UPDATE ON dish_synonyms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS user_priors_updated_at ON user_priors;
CREATE TRIGGER user_priors_updated_at BEFORE UPDATE ON user_priors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE ai_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_priors ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_corrections
CREATE POLICY "Users can view own corrections"
  ON ai_corrections FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own corrections"
  ON ai_corrections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for dish_synonyms (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view dish synonyms"
  ON dish_synonyms FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_priors
CREATE POLICY "Users can view own priors"
  ON user_priors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own priors"
  ON user_priors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own priors"
  ON user_priors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for usage_tracking
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own usage"
  ON usage_tracking FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own usage"
  ON usage_tracking FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function for global corrections analysis
CREATE OR REPLACE FUNCTION get_global_corrections(result_limit integer DEFAULT 50)
RETURNS TABLE (
  original text,
  corrected text,
  count bigint,
  confidence numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.original_name as original,
    ac.corrected_name as corrected,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0))::numeric, 2) as confidence
  FROM ai_corrections ac
  WHERE ac.created_at > NOW() - INTERVAL '30 days'
  GROUP BY ac.original_name, ac.corrected_name
  HAVING COUNT(*) >= 3
  ORDER BY count DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default Indian dish synonyms
INSERT INTO dish_synonyms (canonical_name, synonyms, region, tags) VALUES
  ('roti', '["chapati", "phulka", "fulka"]', 'north_indian', '["bread", "wheat"]'),
  ('dal fry', '["dal tadka", "dal tarka", "tadka dal"]', 'all', '["lentils", "protein"]'),
  ('dal', '["toor dal", "masoor dal", "moong dal"]', 'all', '["lentils", "protein"]'),
  ('chicken curry', '["chicken masala", "murgh curry", "chicken gravy"]', 'all', '["meat", "protein"]'),
  ('paneer curry', '["paneer butter masala", "paneer makhani"]', 'north_indian', '["vegetarian", "protein"]'),
  ('dosa', '["plain dosa", "masala dosa", "rava dosa", "set dosa"]', 'south_indian', '["breakfast", "rice"]'),
  ('idli', '["steamed idli", "mini idli"]', 'south_indian', '["breakfast", "rice"]'),
  ('biryani', '["chicken biryani", "mutton biryani", "veg biryani"]', 'all', '["rice", "main_course"]')
ON CONFLICT DO NOTHING;
