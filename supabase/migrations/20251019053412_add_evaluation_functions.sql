/*
  # Add Evaluation & QA Functions

  ## Overview
  Creates database functions for AI evaluation metrics, QA dashboards, and reporting.

  ## Functions
  - get_metrics_by_category: Aggregate accuracy by dish category
  - get_weekly_quality_report: Summary metrics for weekly review
  - get_low_confidence_dishes: Identify dishes with consistently low confidence

  ## Indexes
  Optimized for reporting queries
*/

-- Function to get metrics by dish category
CREATE OR REPLACE FUNCTION get_metrics_by_category()
RETURNS TABLE (
  category text,
  accuracy numeric,
  avg_confidence numeric,
  edit_rate numeric,
  sample_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH category_analyses AS (
    SELECT 
      COALESCE((pa.detected_dishes->0->>'name')::text, 'unknown') as dish_name,
      pa.id,
      pa.overall_confidence,
      CASE WHEN ac.id IS NOT NULL THEN 1 ELSE 0 END as was_edited
    FROM photo_analyses pa
    LEFT JOIN ai_corrections ac ON ac.analysis_id = pa.id
    WHERE pa.status = 'confirmed'
      AND pa.created_at > NOW() - INTERVAL '30 days'
  ),
  category_stats AS (
    SELECT
      CASE 
        WHEN dish_name ILIKE '%roti%' OR dish_name ILIKE '%chapati%' OR dish_name ILIKE '%paratha%' THEN 'Breads'
        WHEN dish_name ILIKE '%rice%' OR dish_name ILIKE '%biryani%' THEN 'Rice Dishes'
        WHEN dish_name ILIKE '%dal%' OR dish_name ILIKE '%sambar%' THEN 'Lentils'
        WHEN dish_name ILIKE '%paneer%' OR dish_name ILIKE '%chicken%' THEN 'Protein Dishes'
        WHEN dish_name ILIKE '%dosa%' OR dish_name ILIKE '%idli%' THEN 'South Indian'
        ELSE 'Other'
      END as category,
      overall_confidence,
      was_edited
    FROM category_analyses
  )
  SELECT 
    cs.category,
    ROUND((1 - (SUM(cs.was_edited)::numeric / COUNT(*))) * 100, 2) as accuracy,
    ROUND(AVG(cs.overall_confidence) * 100, 2) as avg_confidence,
    ROUND((SUM(cs.was_edited)::numeric / COUNT(*)) * 100, 2) as edit_rate,
    COUNT(*) as sample_count
  FROM category_stats cs
  GROUP BY cs.category
  ORDER BY sample_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get low confidence dishes for targeted improvement
CREATE OR REPLACE FUNCTION get_low_confidence_dishes(confidence_threshold numeric DEFAULT 0.7, min_samples integer DEFAULT 5)
RETURNS TABLE (
  dish_name text,
  avg_confidence numeric,
  sample_count bigint,
  correction_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH dish_stats AS (
    SELECT 
      LOWER(TRIM((pa.detected_dishes->0->>'name')::text)) as dish,
      pa.overall_confidence,
      pa.id,
      CASE WHEN ac.id IS NOT NULL THEN 1 ELSE 0 END as was_corrected
    FROM photo_analyses pa
    LEFT JOIN ai_corrections ac ON ac.analysis_id = pa.id
    WHERE pa.status = 'confirmed'
      AND pa.created_at > NOW() - INTERVAL '30 days'
      AND pa.detected_dishes IS NOT NULL
      AND jsonb_array_length(pa.detected_dishes) > 0
  )
  SELECT 
    ds.dish as dish_name,
    ROUND(AVG(ds.overall_confidence) * 100, 2) as avg_confidence,
    COUNT(*) as sample_count,
    ROUND((SUM(ds.was_corrected)::numeric / COUNT(*)) * 100, 2) as correction_rate
  FROM dish_stats ds
  GROUP BY ds.dish
  HAVING COUNT(*) >= min_samples
    AND AVG(ds.overall_confidence) < confidence_threshold
  ORDER BY avg_confidence ASC, sample_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily metrics summary
CREATE OR REPLACE FUNCTION get_daily_metrics_summary(days_back integer DEFAULT 7)
RETURNS TABLE (
  date date,
  total_analyses bigint,
  avg_confidence numeric,
  corrections_count bigint,
  edit_rate numeric,
  avg_latency_ms numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(pa.created_at) as date,
    COUNT(*) as total_analyses,
    ROUND(AVG(pa.overall_confidence) * 100, 2) as avg_confidence,
    COUNT(DISTINCT ac.id) as corrections_count,
    ROUND((COUNT(DISTINCT ac.analysis_id)::numeric / NULLIF(COUNT(DISTINCT pa.id), 0)) * 100, 2) as edit_rate,
    ROUND(AVG(pa.latency_ms), 0) as avg_latency_ms
  FROM photo_analyses pa
  LEFT JOIN ai_corrections ac ON ac.analysis_id = pa.id
  WHERE pa.created_at > NOW() - (days_back || ' days')::interval
    AND pa.status IN ('analyzed', 'confirmed')
  GROUP BY DATE(pa.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify correction patterns for model improvement
CREATE OR REPLACE FUNCTION get_correction_patterns(min_frequency integer DEFAULT 3)
RETURNS TABLE (
  pattern_type text,
  original_value text,
  corrected_value text,
  frequency bigint,
  avg_confidence numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH correction_groups AS (
    SELECT 
      ac.correction_type as pattern_type,
      ac.original_name as original_value,
      ac.corrected_name as corrected_value,
      pa.overall_confidence
    FROM ai_corrections ac
    JOIN photo_analyses pa ON pa.id = ac.analysis_id
    WHERE ac.created_at > NOW() - INTERVAL '30 days'
      AND ac.correction_type = 'name'
    
    UNION ALL
    
    SELECT 
      'portion' as pattern_type,
      ac.original_name || ' (' || ac.original_portion || 'g)' as original_value,
      ac.corrected_name || ' (' || ac.corrected_portion || 'g)' as corrected_value,
      pa.overall_confidence
    FROM ai_corrections ac
    JOIN photo_analyses pa ON pa.id = ac.analysis_id
    WHERE ac.created_at > NOW() - INTERVAL '30 days'
      AND ac.correction_type = 'portion'
      AND ABS(ac.original_portion - ac.corrected_portion) > 20
  )
  SELECT 
    cg.pattern_type,
    cg.original_value,
    cg.corrected_value,
    COUNT(*) as frequency,
    ROUND(AVG(cg.overall_confidence) * 100, 2) as avg_confidence
  FROM correction_groups cg
  GROUP BY cg.pattern_type, cg.original_value, cg.corrected_value
  HAVING COUNT(*) >= min_frequency
  ORDER BY frequency DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user-specific accuracy for personalization
CREATE OR REPLACE FUNCTION get_user_accuracy_profile(p_user_id uuid)
RETURNS TABLE (
  total_analyses bigint,
  avg_confidence numeric,
  edit_rate numeric,
  common_corrections jsonb,
  dietary_patterns jsonb
) AS $$
BEGIN
  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      COUNT(DISTINCT pa.id) as total,
      AVG(pa.overall_confidence) as avg_conf,
      COUNT(DISTINCT ac.id)::numeric / NULLIF(COUNT(DISTINCT pa.id), 0) as edit_pct
    FROM photo_analyses pa
    LEFT JOIN ai_corrections ac ON ac.analysis_id = pa.id
    WHERE pa.user_id = p_user_id
      AND pa.status IN ('analyzed', 'confirmed')
  ),
  user_corrections AS (
    SELECT 
      jsonb_agg(
        jsonb_build_object(
          'from', ac.original_name,
          'to', ac.corrected_name,
          'count', COUNT(*)
        ) ORDER BY COUNT(*) DESC
      ) FILTER (WHERE ac.original_name IS NOT NULL) as corrections
    FROM ai_corrections ac
    WHERE ac.user_id = p_user_id
      AND ac.created_at > NOW() - INTERVAL '30 days'
    GROUP BY ac.original_name, ac.corrected_name
    LIMIT 10
  )
  SELECT 
    us.total as total_analyses,
    ROUND(us.avg_conf * 100, 2) as avg_confidence,
    ROUND(us.edit_pct * 100, 2) as edit_rate,
    COALESCE(uc.corrections, '[]'::jsonb) as common_corrections,
    '{}'::jsonb as dietary_patterns
  FROM user_stats us
  CROSS JOIN user_corrections uc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for evaluation queries
CREATE INDEX IF NOT EXISTS idx_photo_analyses_status_created ON photo_analyses(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_corrections_created_type ON ai_corrections(created_at DESC, correction_type);
CREATE INDEX IF NOT EXISTS idx_photo_analyses_confidence ON photo_analyses(overall_confidence) WHERE status = 'confirmed';
