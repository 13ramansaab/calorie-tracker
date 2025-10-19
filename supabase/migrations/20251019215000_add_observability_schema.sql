/*
  # Add Observability and Monitoring Schema

  ## Overview
  Comprehensive observability system for tracking DAU, errors, conversions, and performance

  ## 1. New Tables

  ### error_logs
  Centralized error tracking with grouping and categorization
  - error_type (network, model, mapping, validation, system)
  - error_message, stack_trace, context
  - user_id, occurred_at, resolved_at
  - error_group_hash (for grouping similar errors)

  ### performance_metrics
  Track latency and performance of key operations
  - operation_name (photo_analysis, ai_chat, meal_save, etc.)
  - latency_ms, success, error_message
  - user_id, created_at

  ### conversion_events
  Track funnel events for conversion analytics
  - event_type (trial_started, subscribed, canceled, etc.)
  - user_id, from_state, to_state
  - metadata, created_at

  ## 2. Views

  ### daily_active_users
  View for quick DAU calculation

  ### error_summary
  Grouped errors with counts for dashboard

  ## 3. Functions

  ### log_error()
  Centralized error logging with automatic grouping

  ### track_performance()
  Record performance metrics

  ### get_dashboard_stats()
  Get key metrics for observability dashboard

  ## 4. Security
  - RLS enabled on all tables
  - Admin-only access for error logs
*/

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  error_type text CHECK (error_type IN ('network', 'model', 'mapping', 'validation', 'system', 'auth', 'payment')) NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  error_group_hash text NOT NULL,
  context jsonb DEFAULT '{}',
  occurred_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  occurrences integer DEFAULT 1,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  operation_name text NOT NULL,
  latency_ms integer NOT NULL CHECK (latency_ms >= 0),
  success boolean NOT NULL DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create conversion_events table (extends event_tracking)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_tracking' AND column_name = 'event_category') THEN
    ALTER TABLE event_tracking ADD COLUMN event_category text DEFAULT 'general';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_tracking' AND column_name = 'from_state') THEN
    ALTER TABLE event_tracking ADD COLUMN from_state text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'event_tracking' AND column_name = 'to_state') THEN
    ALTER TABLE event_tracking ADD COLUMN to_state text;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_hash ON error_logs(error_group_hash);
CREATE INDEX IF NOT EXISTS idx_error_logs_occurred ON error_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved_at) WHERE resolved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_operation ON performance_metrics(operation_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created ON performance_metrics(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_tracking_category ON event_tracking(event_category);

-- View for Daily Active Users
CREATE OR REPLACE VIEW daily_active_users AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau,
  COUNT(*) as total_events
FROM event_tracking
WHERE event_name IN ('app_opened', 'meal_logged', 'photo_analyzed', 'ai_chat_sent')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View for Error Summary
CREATE OR REPLACE VIEW error_summary AS
SELECT
  error_group_hash,
  error_type,
  error_message,
  COUNT(*) as occurrences,
  MAX(occurred_at) as last_occurred,
  COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as unresolved_count,
  MAX(severity) as max_severity
FROM error_logs
GROUP BY error_group_hash, error_type, error_message
ORDER BY last_occurred DESC;

-- Function to log errors with automatic grouping
CREATE OR REPLACE FUNCTION log_error(
  p_user_id uuid,
  p_error_type text,
  p_error_message text,
  p_stack_trace text DEFAULT NULL,
  p_context jsonb DEFAULT '{}'::jsonb,
  p_severity text DEFAULT 'medium'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_hash text;
  v_existing_error uuid;
  v_new_error_id uuid;
BEGIN
  v_error_hash := md5(p_error_type || ':' || p_error_message);

  SELECT id INTO v_existing_error
  FROM error_logs
  WHERE error_group_hash = v_error_hash
    AND resolved_at IS NULL
  ORDER BY occurred_at DESC
  LIMIT 1;

  IF v_existing_error IS NOT NULL THEN
    UPDATE error_logs
    SET
      occurrences = occurrences + 1,
      occurred_at = now()
    WHERE id = v_existing_error;

    RETURN v_existing_error;
  ELSE
    INSERT INTO error_logs (
      user_id,
      error_type,
      error_message,
      stack_trace,
      error_group_hash,
      context,
      severity,
      occurred_at
    )
    VALUES (
      p_user_id,
      p_error_type,
      p_error_message,
      p_stack_trace,
      v_error_hash,
      p_context,
      p_severity,
      now()
    )
    RETURNING id INTO v_new_error_id;

    RETURN v_new_error_id;
  END IF;
END;
$$;

-- Function to track performance metrics
CREATE OR REPLACE FUNCTION track_performance(
  p_user_id uuid,
  p_operation_name text,
  p_latency_ms integer,
  p_success boolean DEFAULT true,
  p_error_message text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO performance_metrics (
    user_id,
    operation_name,
    latency_ms,
    success,
    error_message,
    metadata
  )
  VALUES (
    p_user_id,
    p_operation_name,
    p_latency_ms,
    p_success,
    p_error_message,
    p_metadata
  );
END;
$$;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_start_date timestamptz DEFAULT (now() - interval '30 days'),
  p_end_date timestamptz DEFAULT now()
)
RETURNS TABLE (
  metric_name text,
  metric_value numeric,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT
      'dau' as name,
      COUNT(DISTINCT CASE WHEN DATE(et.created_at) = CURRENT_DATE THEN et.user_id END)::numeric as value,
      jsonb_build_object('period', 'today')::jsonb as meta
    FROM event_tracking et
    WHERE et.created_at >= p_start_date

    UNION ALL

    SELECT
      'photo_analyses',
      COUNT(*)::numeric,
      jsonb_build_object('period', '30d')::jsonb
    FROM photo_analyses
    WHERE created_at >= p_start_date AND created_at <= p_end_date

    UNION ALL

    SELECT
      'success_rate',
      ROUND((COUNT(CASE WHEN success THEN 1 END)::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 2),
      jsonb_build_object('period', '30d')::jsonb
    FROM performance_metrics
    WHERE operation_name = 'photo_analysis'
      AND created_at >= p_start_date AND created_at <= p_end_date

    UNION ALL

    SELECT
      'conversions',
      COUNT(*)::numeric,
      jsonb_build_object('period', '30d')::jsonb
    FROM event_tracking
    WHERE event_name IN ('trial_started', 'subscription_upgraded')
      AND created_at >= p_start_date AND created_at <= p_end_date

    UNION ALL

    SELECT
      'avg_latency_ms',
      ROUND(AVG(latency_ms)::numeric, 0),
      jsonb_build_object('operation', 'photo_analysis')::jsonb
    FROM performance_metrics
    WHERE operation_name = 'photo_analysis'
      AND created_at >= p_start_date AND created_at <= p_end_date

    UNION ALL

    SELECT
      'error_count',
      COUNT(*)::numeric,
      jsonb_build_object('period', '30d', 'unresolved', COUNT(CASE WHEN resolved_at IS NULL THEN 1 END))::jsonb
    FROM error_logs
    WHERE occurred_at >= p_start_date AND occurred_at <= p_end_date
  )
  SELECT s.name, s.value, s.meta
  FROM stats s;
END;
$$;

-- Function to mark errors as resolved
CREATE OR REPLACE FUNCTION resolve_error_group(
  p_error_group_hash text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE error_logs
  SET resolved_at = now()
  WHERE error_group_hash = p_error_group_hash
    AND resolved_at IS NULL;
END;
$$;

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin-only for error logs, users can see their own performance)
CREATE POLICY "Users can view own performance metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own performance metrics"
  ON performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE error_logs IS 'Centralized error tracking with automatic grouping and severity classification';
COMMENT ON TABLE performance_metrics IS 'Performance and latency tracking for key operations';
COMMENT ON VIEW daily_active_users IS 'Daily active users calculated from event tracking';
COMMENT ON VIEW error_summary IS 'Grouped error summary for dashboard';
COMMENT ON FUNCTION log_error IS 'Log an error with automatic grouping and deduplication';
COMMENT ON FUNCTION track_performance IS 'Track performance metrics for an operation';
COMMENT ON FUNCTION get_dashboard_stats IS 'Get key metrics for observability dashboard (DAU, success rate, conversions, etc.)';
