/*
  # Seed Unit Presets and Dish Synonyms

  ## Overview
  Production-ready reference data for Indian foods and portion sizes

  ## 1. Unit Presets
  Comprehensive portion size data for common Indian foods
  - min_grams, max_grams, avg_grams for accurate portion estimation
  - Regional variations where applicable
  - Organized by category (breads, rice, curries, sweets, etc.)

  ## 2. Dish Synonyms
  Bidirectional mapping of regional and English food terms
  - Hindi ↔ English
  - Regional variations
  - Common misspellings

  ## Security
  - Public read access (reference data)
  - No user-specific data
*/

-- Truncate existing data for clean seed
TRUNCATE TABLE unit_presets CASCADE;
TRUNCATE TABLE dish_synonyms CASCADE;

-- ============================================
-- UNIT PRESETS - INDIAN FOOD PORTIONS
-- ============================================

INSERT INTO unit_presets (food_item, unit_type, min_grams, max_grams, avg_grams, region, category, notes) VALUES

-- BREADS / FLATBREADS
('chapati', 'piece', 35, 50, 40, 'All India', 'bread', 'Standard home-made whole wheat flatbread, ~6 inch diameter'),
('roti', 'piece', 35, 50, 40, 'All India', 'bread', 'Same as chapati, common North Indian term'),
('paratha', 'piece', 55, 75, 65, 'North India', 'bread', 'Layered flatbread, usually ghee-brushed'),
('aloo paratha', 'piece', 80, 100, 90, 'North India', 'bread', 'Stuffed paratha with potato filling'),
('poori', 'piece', 30, 40, 35, 'All India', 'bread', 'Deep-fried puffed bread'),
('bhatura', 'piece', 60, 80, 70, 'North India', 'bread', 'Large deep-fried bread (chole bhature)'),
('naan', 'piece', 80, 120, 100, 'North India', 'bread', 'Tandoor-baked leavened bread'),
('kulcha', 'piece', 70, 90, 80, 'North India', 'bread', 'Soft leavened flatbread'),
('thepla', 'piece', 30, 40, 35, 'Gujarat', 'bread', 'Spiced flatbread from Gujarat'),

-- SOUTH INDIAN BREADS
('dosa', 'piece', 100, 140, 120, 'South India', 'bread', 'Plain rice and lentil crepe'),
('masala dosa', 'piece', 220, 280, 250, 'South India', 'bread', 'Dosa with potato filling'),
('idli', 'piece', 35, 45, 40, 'South India', 'breakfast', 'Steamed rice and lentil cake'),
('vada', 'piece', 40, 50, 45, 'South India', 'snack', 'Deep-fried lentil donut'),
('uttapam', 'piece', 120, 160, 140, 'South India', 'bread', 'Thick rice pancake with toppings'),

-- RICE DISHES
('rice', 'small_bowl', 130, 170, 150, 'All India', 'grain', 'Small serving of cooked rice (katori)'),
('rice', 'medium_bowl', 180, 220, 200, 'All India', 'grain', 'Medium serving of cooked rice'),
('rice', 'large_bowl', 250, 300, 275, 'All India', 'grain', 'Large serving of cooked rice'),
('biryani', 'plate', 300, 350, 325, 'All India', 'grain', 'Full plate of biryani with meat/vegetables'),
('pulao', 'bowl', 200, 250, 225, 'All India', 'grain', 'Seasoned rice with vegetables'),
('jeera rice', 'bowl', 180, 220, 200, 'All India', 'grain', 'Cumin-flavored rice'),
('curd rice', 'bowl', 200, 250, 225, 'South India', 'grain', 'Rice mixed with yogurt'),

-- CURRIES & GRAVIES (KATORI PORTIONS)
('dal', 'katori', 120, 160, 140, 'All India', 'curry', 'Lentil curry, standard katori (~150ml)'),
('sabzi', 'katori', 120, 160, 140, 'All India', 'curry', 'Vegetable curry/dry vegetable'),
('paneer butter masala', 'katori', 140, 180, 160, 'North India', 'curry', 'Rich paneer curry'),
('palak paneer', 'katori', 140, 180, 160, 'North India', 'curry', 'Spinach and cottage cheese curry'),
('rajma', 'katori', 140, 180, 160, 'North India', 'curry', 'Kidney bean curry'),
('chole', 'katori', 140, 180, 160, 'North India', 'curry', 'Chickpea curry'),
('sambar', 'katori', 120, 160, 140, 'South India', 'curry', 'South Indian lentil and vegetable stew'),
('rasam', 'katori', 100, 140, 120, 'South India', 'curry', 'Tangy South Indian soup'),
('kadhi', 'katori', 120, 160, 140, 'North India', 'curry', 'Yogurt-based curry'),
('paneer tikka masala', 'katori', 150, 190, 170, 'North India', 'curry', 'Grilled paneer in rich gravy'),

-- PROTEIN DISHES
('paneer bhurji', 'bowl', 160, 200, 180, 'North India', 'protein', 'Scrambled cottage cheese'),
('egg bhurji', 'bowl', 120, 160, 140, 'All India', 'protein', 'Scrambled eggs Indian style'),
('chicken curry', 'katori', 150, 190, 170, 'All India', 'protein', 'Chicken in gravy'),
('fish curry', 'katori', 140, 180, 160, 'Coastal India', 'protein', 'Fish in curry'),
('mutton curry', 'katori', 150, 190, 170, 'All India', 'protein', 'Mutton/lamb in gravy'),

-- DAIRY
('curd', 'katori', 100, 140, 120, 'All India', 'dairy', 'Plain yogurt in katori'),
('raita', 'katori', 100, 140, 120, 'All India', 'dairy', 'Yogurt with vegetables/fruits'),
('paneer', 'cube', 20, 30, 25, 'All India', 'protein', 'Per 1-inch cube of cottage cheese'),
('milk', 'glass', 240, 260, 250, 'All India', 'dairy', 'Standard glass of milk (~250ml)'),

-- SNACKS & STREET FOOD
('samosa', 'piece', 60, 80, 70, 'All India', 'snack', 'Fried pastry with filling'),
('pakora', 'piece', 25, 35, 30, 'All India', 'snack', 'Vegetable fritter'),
('kachori', 'piece', 45, 60, 52, 'North India', 'snack', 'Fried stuffed pastry'),
('dhokla', 'piece', 70, 90, 80, 'Gujarat', 'snack', 'Steamed savory cake (2x2 inch)'),
('sandwich', 'piece', 100, 140, 120, 'All India', 'snack', 'Bread sandwich with filling'),
('pav bhaji', 'plate', 280, 340, 310, 'Maharashtra', 'meal', 'Vegetable curry with bread rolls'),
('vada pav', 'piece', 110, 140, 125, 'Maharashtra', 'snack', 'Potato fritter in bun'),

-- SWEETS / DESSERTS
('gulab jamun', 'piece', 50, 60, 55, 'All India', 'sweet', 'Deep-fried milk solid balls in syrup'),
('rasgulla', 'piece', 35, 45, 40, 'East India', 'sweet', 'Spongy cottage cheese balls in syrup'),
('jalebi', 'piece', 30, 40, 35, 'All India', 'sweet', 'Deep-fried pretzel-shaped sweet'),
('ladoo', 'piece', 35, 50, 42, 'All India', 'sweet', 'Round sweet ball'),
('barfi', 'piece', 30, 40, 35, 'All India', 'sweet', 'Milk-based fudge (1 inch square)'),
('kheer', 'katori', 120, 150, 135, 'All India', 'sweet', 'Rice pudding'),
('halwa', 'katori', 100, 130, 115, 'All India', 'sweet', 'Dense sweet pudding'),
('rasmalai', 'piece', 50, 65, 57, 'East India', 'sweet', 'Cottage cheese patty in sweet milk'),

-- BEVERAGES
('chai', 'cup', 150, 200, 175, 'All India', 'beverage', 'Indian tea with milk (~175ml)'),
('coffee', 'cup', 150, 200, 175, 'All India', 'beverage', 'Coffee with milk'),
('lassi', 'glass', 240, 300, 270, 'North India', 'beverage', 'Yogurt-based drink'),
('nimbu pani', 'glass', 240, 280, 260, 'All India', 'beverage', 'Lemon water'),

-- COMMON INGREDIENTS
('egg', 'piece', 50, 60, 55, 'All India', 'protein', 'Whole egg, medium size'),
('aloo', 'piece', 80, 120, 100, 'All India', 'vegetable', 'Medium potato'),
('tomato', 'piece', 80, 120, 100, 'All India', 'vegetable', 'Medium tomato'),
('onion', 'piece', 80, 120, 100, 'All India', 'vegetable', 'Medium onion')

ON CONFLICT (food_item, unit_type, region) DO UPDATE SET
  min_grams = EXCLUDED.min_grams,
  max_grams = EXCLUDED.max_grams,
  avg_grams = EXCLUDED.avg_grams,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes;

-- ============================================
-- DISH SYNONYMS - BIDIRECTIONAL MAPPINGS
-- ============================================

INSERT INTO dish_synonyms (canonical_name, synonyms, region, tags, usage_count) VALUES

-- BREADS
('roti', '["chapati", "chapathi", "phulka", "rotti"]', 'All India', '["bread", "flatbread"]', 0),
('paratha', '["parantha", "parota", "parantha"]', 'North India', '["bread", "flatbread"]', 0),
('naan', '["nan", "naan bread"]', 'North India', '["bread", "tandoor"]', 0),
('dosa', '["dosai", "dose", "dhosha"]', 'South India', '["breakfast", "crepe"]', 0),
('poori', '["puri"]', 'All India', '["bread", "fried"]', 0),

-- RICE
('rice', '["chawal", "bhat", "annam"]', 'All India', '["grain", "staple"]', 0),
('biryani', '["biriyani", "biriani", "briyani"]', 'All India', '["rice", "festive"]', 0),
('pulao', '["pilaf", "pilav", "pulav"]', 'All India', '["rice"]', 0),

-- LENTILS
('dal', '["daal", "dhal", "dhaal", "lentil", "lentil soup"]', 'All India', '["protein", "curry"]', 0),
('sambar', '["sambhar", "sambaar"]', 'South India', '["lentil", "curry"]', 0),

-- VEGETABLES
('sabzi', '["sabji", "subzi", "subji", "vegetable curry", "veg curry"]', 'All India', '["vegetable", "curry"]', 0),
('aloo', '["potato", "batata"]', 'All India', '["vegetable"]', 0),

-- PANEER DISHES
('paneer', '["cottage cheese", "panir"]', 'All India', '["protein", "dairy"]', 0),
('paneer butter masala', '["paneer makhani", "butter paneer"]', 'North India', '["curry", "rich"]', 0),
('palak paneer', '["saag paneer", "spinach paneer"]', 'North India', '["curry", "spinach"]', 0),
('paneer tikka', '["paneer kabab"]', 'North India', '["grilled", "starter"]', 0),

-- DAIRY
('curd', '["dahi", "yogurt", "yoghurt"]', 'All India', '["dairy"]', 0),
('milk', '["doodh"]', 'All India', '["dairy", "beverage"]', 0),
('ghee', '["clarified butter"]', 'All India', '["fat", "cooking"]', 0),

-- CURRIES
('rajma', '["kidney beans", "kidney bean curry"]', 'North India', '["curry", "protein"]', 0),
('chole', '["chana", "chickpeas", "chickpea curry", "chhola"]', 'North India', '["curry", "protein"]', 0),
('kadhi', '["karhi"]', 'North India', '["curry", "yogurt"]', 0),

-- SNACKS
('samosa', '["samossa", "singara"]', 'All India', '["snack", "fried"]', 0),
('pakora', '["pakoda", "bhaji", "fritter"]', 'All India', '["snack", "fried"]', 0),
('vada pav', '["wada pav", "vada paav"]', 'Maharashtra', '["street food", "snack"]', 0),
('pav bhaji', '["paav bhaaji"]', 'Maharashtra', '["street food"]', 0),

-- SWEETS
('gulab jamun', '["gulabjamun", "gulab jaman"]', 'All India', '["sweet", "dessert"]', 0),
('rasgulla', '["rosogolla", "ras gulla"]', 'East India', '["sweet", "dessert"]', 0),
('jalebi', '["jilapi", "jilipi"]', 'All India', '["sweet", "dessert"]', 0),
('ladoo', '["laddu", "laddoo"]', 'All India', '["sweet", "dessert"]', 0),
('barfi', '["burfi"]', 'All India', '["sweet", "dessert"]', 0),
('kheer', '["payasam", "payesh", "rice pudding"]', 'All India', '["sweet", "dessert"]', 0),
('halwa', '["halva"]', 'All India', '["sweet", "dessert"]', 0),

-- BEVERAGES
('chai', '["tea", "chay", "cha"]', 'All India', '["beverage", "hot"]', 0),
('lassi', '["lassie"]', 'North India', '["beverage", "dairy"]', 0),
('nimbu pani', '["lemonade", "lemon water", "shikanji"]', 'All India', '["beverage", "cold"]', 0),

-- BREAKFAST ITEMS
('idli', '["idly"]', 'South India', '["breakfast", "steamed"]', 0),
('vada', '["vadai", "medu vada"]', 'South India', '["breakfast", "fried"]', 0),
('upma', '["uppuma"]', 'South India', '["breakfast", "semolina"]', 0),
('poha', '["pohe", "aval", "flattened rice"]', 'All India', '["breakfast", "light"]', 0),

-- STREET FOOD
('chaat', '["chat"]', 'All India', '["street food", "snack"]', 0),
('pani puri', '["golgappa", "puchka", "gupchup"]', 'All India', '["street food", "snack"]', 0),
('bhel puri', '["bhel"]', 'Maharashtra', '["street food", "snack"]', 0),
('dahi puri', '["dahi poori"]', 'All India', '["street food", "snack"]', 0),

-- COMMON MISSPELLINGS / VARIATIONS
('masala', '["massala", "masaala"]', 'All India', '["spice"]', 0),
('tikka', '["tika", "tikka masala"]', 'All India', '["grilled"]', 0),
('tandoor', '["tandoori", "tondoor"]', 'All India', '["cooking method"]', 0),
('curry', '["currie", "kari"]', 'All India', '["dish"]', 0)

ON CONFLICT (canonical_name) DO UPDATE SET
  synonyms = EXCLUDED.synonyms,
  region = EXCLUDED.region,
  tags = EXCLUDED.tags,
  updated_at = now();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify unit presets count
DO $$
DECLARE
  preset_count integer;
BEGIN
  SELECT COUNT(*) INTO preset_count FROM unit_presets;
  RAISE NOTICE 'Seeded % unit presets', preset_count;
END $$;

-- Verify dish synonyms count
DO $$
DECLARE
  synonym_count integer;
BEGIN
  SELECT COUNT(*) INTO synonym_count FROM dish_synonyms;
  RAISE NOTICE 'Seeded % dish synonym mappings', synonym_count;
END $$;

-- Create helper function to search synonyms
CREATE OR REPLACE FUNCTION find_canonical_name(search_term text)
RETURNS TABLE (
  canonical_name text,
  match_type text,
  region text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.canonical_name,
    CASE
      WHEN ds.canonical_name ILIKE search_term THEN 'exact'
      WHEN ds.synonyms::text ILIKE '%' || search_term || '%' THEN 'synonym'
      ELSE 'none'
    END as match_type,
    ds.region
  FROM dish_synonyms ds
  WHERE
    ds.canonical_name ILIKE search_term
    OR ds.synonyms::text ILIKE '%' || search_term || '%'
  ORDER BY
    CASE
      WHEN ds.canonical_name ILIKE search_term THEN 1
      ELSE 2
    END;
END;
$$;

COMMENT ON FUNCTION find_canonical_name IS 'Search for canonical food name from user input (handles synonyms)';

-- Examples of usage:
-- SELECT * FROM find_canonical_name('chapati');  -- Returns 'roti'
-- SELECT * FROM find_canonical_name('dahi');     -- Returns 'curd'
-- SELECT * FROM find_canonical_name('cottage cheese');  -- Returns 'paneer'
