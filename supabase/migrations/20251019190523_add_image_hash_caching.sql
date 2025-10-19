/*
  # Add Image Hash Caching for AI Analysis

  1. Changes
    - Add `image_hash` column to `photo_analyses` table
    - Add index on `image_hash` for fast cache lookups
    - Add index on `created_at` for cache expiration queries

  2. Performance
    - Enables duplicate image detection
    - Reduces API calls for repeated photos
    - 7-day cache duration
*/

-- Add image_hash column to photo_analyses
ALTER TABLE photo_analyses
ADD COLUMN IF NOT EXISTS image_hash text;

-- Add index on image_hash for cache lookups
CREATE INDEX IF NOT EXISTS idx_photo_analyses_image_hash ON photo_analyses(image_hash)
WHERE image_hash IS NOT NULL;

-- Add composite index for cache queries (hash + date)
CREATE INDEX IF NOT EXISTS idx_photo_analyses_hash_date ON photo_analyses(image_hash, created_at DESC)
WHERE image_hash IS NOT NULL;

-- Add comment
COMMENT ON COLUMN photo_analyses.image_hash IS 'SHA-256 hash of the image for cache deduplication (7-day TTL)';
