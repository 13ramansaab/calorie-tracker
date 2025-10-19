/*
  # Add Unit Presets Table

  ## Overview
  Creates a reference table for standardized portion sizes of common Indian food items.
  Used to convert user-friendly units (e.g., "1 chapati", "1 katori dal") into grams.

  ## New Tables
  
  ### unit_presets
  Reference data for portion conversions
  - food_item, unit_type (piece/bowl/cup/plate)
  - min_grams, max_grams, avg_grams
  - region, notes
  
  ## Security
  - Public read access (reference data)
  - No RLS needed (static reference table)
  
  ## Seed Data
  - 30+ common Indian food items
  - North & South Indian regional variations
*/

-- unit_presets: Standardized portion sizes
CREATE TABLE IF NOT EXISTS unit_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_item text NOT NULL,
  unit_type text NOT NULL,
  min_grams numeric NOT NULL,
  max_grams numeric NOT NULL,
  avg_grams numeric NOT NULL,
  region text,
  category text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(food_item, unit_type, region)
);

CREATE INDEX IF NOT EXISTS idx_unit_presets_food_item ON unit_presets(food_item);
CREATE INDEX IF NOT EXISTS idx_unit_presets_category ON unit_presets(category);

-- Enable RLS (public read)
ALTER TABLE unit_presets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'unit_presets' AND policyname = 'Public can read presets'
  ) THEN
    CREATE POLICY "Public can read presets"
      ON unit_presets FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Seed unit presets for Indian foods

-- BREADS
INSERT INTO unit_presets (food_item, unit_type, min_grams, max_grams, avg_grams, region, category, notes) VALUES
  ('chapati', 'piece', 30, 40, 35, 'North India', 'bread', 'Standard home-made roti, ~6 inch diameter'),
  ('roti', 'piece', 30, 40, 35, 'North India', 'bread', 'Same as chapati'),
  ('paratha', 'piece', 45, 60, 50, 'North India', 'bread', 'Layered flatbread, usually ghee-brushed'),
  ('naan', 'piece', 60, 90, 75, 'North India', 'bread', 'Tandoor-baked, restaurant portion'),
  ('puri', 'piece', 15, 25, 20, 'North India', 'bread', 'Deep-fried puffed bread'),
  ('bhatura', 'piece', 60, 80, 70, 'North India', 'bread', 'Large deep-fried bread for chole bhature'),
  
  ('idli', 'piece', 35, 50, 40, 'South India', 'breakfast', 'Steamed rice cake, standard size'),
  ('dosa', 'piece', 100, 150, 120, 'South India', 'breakfast', 'Thin crispy crepe, full size'),
  ('vada', 'piece', 35, 50, 45, 'South India', 'breakfast', 'Fried lentil donut'),
  ('uttapam', 'piece', 80, 120, 100, 'South India', 'breakfast', 'Thick savory pancake'),
  ('appam', 'piece', 40, 60, 50, 'South India', 'breakfast', 'Bowl-shaped fermented pancake'),
  
  -- RICE & GRAINS
  ('rice', 'katori', 120, 160, 140, 'All India', 'grain', 'Small bowl, cooked white rice'),
  ('rice', 'plate', 200, 280, 240, 'All India', 'grain', 'Standard plate serving'),
  ('biryani', 'plate', 300, 400, 350, 'All India', 'rice', 'Full meal portion with meat/veg'),
  ('pulao', 'katori', 140, 180, 160, 'All India', 'rice', 'Flavored rice, small bowl'),
  ('upma', 'katori', 100, 150, 120, 'South India', 'breakfast', 'Semolina porridge'),
  ('poha', 'katori', 80, 120, 100, 'West India', 'breakfast', 'Flattened rice'),
  
  -- CURRIES & DALS
  ('dal', 'katori', 130, 170, 150, 'All India', 'lentils', 'Liquid lentil curry, ~150ml bowl'),
  ('dal', 'cup', 200, 250, 225, 'All India', 'lentils', 'Standard cup size'),
  ('sambar', 'katori', 140, 180, 160, 'South India', 'lentils', 'Lentil-vegetable stew'),
  ('rasam', 'katori', 100, 140, 120, 'South India', 'liquid', 'Thin tamarind soup'),
  ('paneer curry', 'katori', 150, 200, 175, 'North India', 'curry', 'Paneer in gravy'),
  ('chicken curry', 'katori', 180, 240, 210, 'All India', 'curry', 'Chicken pieces in gravy'),
  ('sabzi', 'katori', 100, 150, 125, 'North India', 'vegetable', 'Dry vegetable curry'),
  ('chole', 'katori', 140, 180, 160, 'North India', 'curry', 'Chickpea curry'),
  ('rajma', 'katori', 140, 180, 160, 'North India', 'curry', 'Kidney bean curry'),
  
  -- RAITA & SIDES
  ('raita', 'katori', 80, 120, 100, 'All India', 'side', 'Yogurt-based side dish'),
  ('chutney', 'spoon', 15, 25, 20, 'All India', 'condiment', 'Tablespoon serving'),
  ('pickle', 'spoon', 10, 20, 15, 'All India', 'condiment', 'Tablespoon serving'),
  ('papad', 'piece', 8, 15, 12, 'All India', 'side', 'Crispy thin wafer'),
  
  -- SNACKS
  ('samosa', 'piece', 50, 80, 65, 'All India', 'snack', 'Deep-fried pastry'),
  ('pakora', 'piece', 20, 35, 25, 'All India', 'snack', 'Fritter, per piece'),
  ('vada pav', 'piece', 100, 140, 120, 'West India', 'snack', 'Potato fritter in bun'),
  ('pav bhaji', 'plate', 250, 350, 300, 'West India', 'snack', 'Vegetable mash with bread'),
  
  -- SWEETS
  ('gulab jamun', 'piece', 40, 60, 50, 'All India', 'sweet', 'Deep-fried milk ball in syrup'),
  ('rasgulla', 'piece', 35, 50, 45, 'East India', 'sweet', 'Spongy cheese ball in syrup'),
  ('ladoo', 'piece', 30, 50, 40, 'All India', 'sweet', 'Round sweet ball'),
  ('barfi', 'piece', 25, 40, 30, 'All India', 'sweet', 'Square milk fudge'),
  ('jalebi', 'piece', 20, 35, 25, 'All India', 'sweet', 'Fried pretzel in syrup'),
  
  -- BEVERAGES
  ('chai', 'cup', 150, 200, 175, 'All India', 'beverage', 'Tea with milk, ~175ml'),
  ('lassi', 'glass', 200, 300, 250, 'North India', 'beverage', 'Yogurt drink'),
  ('coffee', 'cup', 150, 200, 175, 'South India', 'beverage', 'Filter coffee'),
  
  -- PROTEINS
  ('egg', 'piece', 50, 60, 55, 'All India', 'protein', 'Whole egg, medium size'),
  ('paneer', 'cube', 20, 30, 25, 'North India', 'protein', 'Per 1-inch cube')

ON CONFLICT (food_item, unit_type, region) DO NOTHING;

-- Function to get unit preset
CREATE OR REPLACE FUNCTION get_unit_preset(
  p_food_item text,
  p_unit_type text DEFAULT 'piece',
  p_region text DEFAULT NULL
)
RETURNS TABLE (
  min_grams numeric,
  max_grams numeric,
  avg_grams numeric,
  notes text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.min_grams,
    up.max_grams,
    up.avg_grams,
    up.notes
  FROM unit_presets up
  WHERE 
    up.food_item = p_food_item
    AND up.unit_type = p_unit_type
    AND (p_region IS NULL OR up.region = p_region OR up.region = 'All India')
  ORDER BY 
    CASE 
      WHEN up.region = p_region THEN 1
      WHEN up.region = 'All India' THEN 2
      ELSE 3
    END
  LIMIT 1;
END;
$$;

-- Function to convert count to grams
CREATE OR REPLACE FUNCTION convert_to_grams(
  p_food_item text,
  p_count numeric,
  p_unit_type text DEFAULT 'piece',
  p_region text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  v_avg_grams numeric;
BEGIN
  SELECT avg_grams INTO v_avg_grams
  FROM get_unit_preset(p_food_item, p_unit_type, p_region);
  
  IF v_avg_grams IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN v_avg_grams * p_count;
END;
$$;

COMMENT ON TABLE unit_presets IS 'Reference table for standardized portion sizes of Indian foods';
COMMENT ON FUNCTION get_unit_preset IS 'Get unit preset with region fallback (regional > All India)';
COMMENT ON FUNCTION convert_to_grams IS 'Convert count + unit to grams using presets';
