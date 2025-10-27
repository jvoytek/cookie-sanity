-- Add type column to payments table
ALTER TABLE "public"."payments"
ADD COLUMN "type" character varying;

-- Add a check constraint to ensure type is one of the allowed values
ALTER TABLE "public"."payments"
ADD CONSTRAINT payments_type_check 
CHECK (type IS NULL OR type IN ('Cash', 'Check', 'Digital Cookie', 'Other'));

-- Add a comment to explain the column
COMMENT ON COLUMN "public"."payments"."type" IS 'Payment type: Cash, Check, Digital Cookie, or Other';
