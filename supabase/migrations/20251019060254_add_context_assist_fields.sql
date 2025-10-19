/*
  # Add Context Assist Fields for Phase 1 MVP

  ## Overview
  Extends schema to support user-provided context (notes) in the AI analysis flow.
  
  ## Changes
  
  ### 1. PhotoAnalyses Table
  - `user_note` (text): The context/description provided by the user
  - `note_used` (boolean): Whether the note influenced the analysis
  - `note_influence_summary` (jsonb): Per-item tracking of how note was used
    Format: [{"item": "chapati", "influence": "portion"}, ...]
  
  ### 2. MealLogs Table
  - `context_note` (text): Snapshot of user note for historical reference
  
  ### 3. AnalysisEvents Table (NEW)
  - Track instrumentation events for note usage and conflicts
  - Fields: user_id, event_type, event_data, created_at
  
  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
*/

-- Add fields to photo_analyses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photo_analyses' AND column_name = 'user_note'
  ) THEN
    ALTER TABLE photo_analyses
      ADD COLUMN user_note text,
      ADD COLUMN note_used boolean DEFAULT false,
      ADD COLUMN note_influence_summary jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add context_note to meal_logs (source already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_logs' AND column_name = 'context_note'
  ) THEN
    ALTER TABLE meal_logs ADD COLUMN context_note text;
  END IF;
END $$;

-- Create analysis_events table for instrumentation
CREATE TABLE IF NOT EXISTS analysis_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add index for event queries
CREATE INDEX IF NOT EXISTS idx_analysis_events_user_id ON analysis_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_events_type ON analysis_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analysis_events_created_at ON analysis_events(created_at DESC);

-- Enable RLS
ALTER TABLE analysis_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analysis_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analysis_events' AND policyname = 'Users can insert own events'
  ) THEN
    CREATE POLICY "Users can insert own events"
      ON analysis_events FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'analysis_events' AND policyname = 'Users can view own events'
  ) THEN
    CREATE POLICY "Users can view own events"
      ON analysis_events FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Helper function to log events
CREATE OR REPLACE FUNCTION log_analysis_event(
  p_event_type text,
  p_event_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO analysis_events (user_id, event_type, event_data)
  VALUES (auth.uid(), p_event_type, p_event_data)
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

COMMENT ON TABLE analysis_events IS 'Instrumentation events for AI analysis features';
COMMENT ON FUNCTION log_analysis_event IS 'Helper to log analysis events with automatic user_id';
