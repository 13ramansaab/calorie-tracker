-- Update photo_analyses table to match the code requirements
ALTER TABLE photo_analyses 
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS user_note text,
ADD COLUMN IF NOT EXISTS note_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS note_conflict boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS note_influence_summary text,
ADD COLUMN IF NOT EXISTS raw_response jsonb,
ADD COLUMN IF NOT EXISTS parsed_output jsonb,
ADD COLUMN IF NOT EXISTS latency_ms integer,
ADD COLUMN IF NOT EXISTS ai_model_version text;

-- Update the existing image_url to photo_url if needed
UPDATE photo_analyses SET photo_url = image_url WHERE photo_url IS NULL;

-- Make photo_url NOT NULL
ALTER TABLE photo_analyses ALTER COLUMN photo_url SET NOT NULL;
