/*
  # Add Monitoring and Optimization Fields

  ## Changes
  
  ### photo_analyses Table
  - Add image_hash field for caching
  - Add latency_ms field for performance tracking
  
  ### Analysis Events Enhancements
  - Already has event_type and event_data for monitoring
  
  ## Notes
  - Enables 7-day caching of repeated image analyses
  - Tracks performance metrics for alerting
*/

-- Add image_hash for caching
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photo_analyses' AND column_name = 'image_hash'
  ) THEN
    ALTER TABLE photo_analyses ADD COLUMN image_hash text;
  END IF;
END $$;

-- Add latency tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'photo_analyses' AND column_name = 'latency_ms'
  ) THEN
    ALTER TABLE photo_analyses ADD COLUMN latency_ms integer;
  END IF;
END $$;

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_photo_analyses_image_hash 
  ON photo_analyses(user_id, image_hash, created_at DESC);

-- Index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_photo_analyses_latency 
  ON photo_analyses(created_at, latency_ms);

COMMENT ON COLUMN photo_analyses.image_hash IS 'SHA256 hash of image for caching duplicate analyses';
COMMENT ON COLUMN photo_analyses.latency_ms IS 'Total analysis latency in milliseconds for monitoring';
