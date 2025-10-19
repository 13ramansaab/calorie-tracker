/*
  # Add Missing Profile Fields

  ## Overview
  Adds subscription and personalization fields to profiles table

  ## Changes
  1. Add subscription_tier field (free, premium, lifetime)
  2. Add subscription_status field (active, canceled, past_due, trialing)
  3. Add subscription_end_date for tracking expiry
  4. Add trial_start and trial_end for free trial tracking
  5. Add region field for regional preferences
  6. Add dietary_preferences field (jsonb array)
  7. Add stripe_customer_id for payment integration

  ## Security
  - RLS policies already exist for profiles table
  - No new policies needed
*/

-- Add subscription fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_tier') THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text CHECK (subscription_tier IN ('free', 'premium', 'lifetime')) DEFAULT 'free';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status text CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_end_date') THEN
    ALTER TABLE profiles ADD COLUMN subscription_end_date timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_start') THEN
    ALTER TABLE profiles ADD COLUMN trial_start timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'trial_end') THEN
    ALTER TABLE profiles ADD COLUMN trial_end timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Add personalization fields
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'region') THEN
    ALTER TABLE profiles ADD COLUMN region text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dietary_preferences') THEN
    ALTER TABLE profiles ADD COLUMN dietary_preferences jsonb DEFAULT '[]';
  END IF;
END $$;

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- Comments
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription level: free, premium, or lifetime';
COMMENT ON COLUMN profiles.subscription_status IS 'Current subscription status';
COMMENT ON COLUMN profiles.region IS 'User region for personalized unit presets and food recommendations';
COMMENT ON COLUMN profiles.dietary_preferences IS 'Array of dietary restrictions and preferences (vegetarian, vegan, etc.)';
