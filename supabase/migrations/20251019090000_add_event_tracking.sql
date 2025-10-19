/*
  # Add Event Tracking for Observability

  1. New Tables
    - `app_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `event_name` (text)
      - `event_data` (jsonb)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on `app_events` table
    - Add policies for users to track their own events
    - Service role can read all events for analytics

  3. Indexes
    - Index on user_id and timestamp for fast queries
    - Index on event_name for aggregations
*/

-- Create app_events table
CREATE TABLE IF NOT EXISTS app_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_events_user_id ON app_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_events_timestamp ON app_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_event_name ON app_events(event_name);
CREATE INDEX IF NOT EXISTS idx_app_events_user_timestamp ON app_events(user_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE app_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own events"
  ON app_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own events"
  ON app_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can read all events for analytics dashboard
-- This is handled automatically by Supabase service role permissions
