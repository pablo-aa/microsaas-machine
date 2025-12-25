-- Add payment_variant column to payments table
-- This stores the GrowthBook feature flag variant (A, B, C, etc.) for each payment
-- Used to track which payment experience variant the user saw during checkout

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_variant TEXT;

-- Add comment for documentation
COMMENT ON COLUMN payments.payment_variant IS 'GrowthBook feature flag variant (payment_experience) that was active when payment was created. Used for A/B testing analysis.';

