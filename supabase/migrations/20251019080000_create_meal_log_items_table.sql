/*
  # Create meal_log_items table if it doesn't exist
  
  ## Overview
  Ensures the meal_log_items table exists with the correct base structure.
  This table stores individual food items within each meal log.
*/

-- Create meal_log_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS meal_log_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_log_id uuid NOT NULL REFERENCES meal_logs(id) ON DELETE CASCADE,
  food_item_id uuid REFERENCES food_items(id) ON DELETE SET NULL,
  food_name text NOT NULL,
  portion_grams numeric NOT NULL CHECK (portion_grams > 0),
  calories numeric NOT NULL CHECK (calories >= 0),
  protein_grams numeric NOT NULL CHECK (protein_grams >= 0),
  carbs_grams numeric NOT NULL CHECK (carbs_grams >= 0),
  fat_grams numeric NOT NULL CHECK (fat_grams >= 0),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_log_items_meal_log_id ON meal_log_items(meal_log_id);
CREATE INDEX IF NOT EXISTS idx_meal_log_items_food_item_id ON meal_log_items(food_item_id);

-- Enable Row Level Security
ALTER TABLE meal_log_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for meal_log_items
CREATE POLICY "Users can view their own meal log items" ON meal_log_items
  FOR SELECT USING (
    meal_log_id IN (
      SELECT id FROM meal_logs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own meal log items" ON meal_log_items
  FOR INSERT WITH CHECK (
    meal_log_id IN (
      SELECT id FROM meal_logs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own meal log items" ON meal_log_items
  FOR UPDATE USING (
    meal_log_id IN (
      SELECT id FROM meal_logs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own meal log items" ON meal_log_items
  FOR DELETE USING (
    meal_log_id IN (
      SELECT id FROM meal_logs WHERE user_id = auth.uid()
    )
  );
