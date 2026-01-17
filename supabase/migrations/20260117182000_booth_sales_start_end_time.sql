-- Add start_time and end_time columns to booth_sales table
-- Replace the single sale_time text field with proper time fields

-- Add new columns as nullable first
ALTER TABLE "public"."booth_sales" ADD COLUMN "start_time" time without time zone;
ALTER TABLE "public"."booth_sales" ADD COLUMN "end_time" time without time zone;

-- Migrate existing data from sale_time to start_time
-- Assumes sale_time is in HH:MM format
UPDATE "public"."booth_sales"
SET "start_time" = CASE
  WHEN "sale_time" IS NOT NULL AND "sale_time" ~ '^[0-9]{1,2}:[0-9]{2}$'
  THEN "sale_time"::time
  ELSE NULL
END
WHERE "sale_time" IS NOT NULL;

-- Set end_time to start_time + 2 hours for existing records
UPDATE "public"."booth_sales"
SET "end_time" = ("start_time" + INTERVAL '2 hours')::time
WHERE "start_time" IS NOT NULL;

-- Drop the old sale_time column
ALTER TABLE "public"."booth_sales" DROP COLUMN "sale_time";

-- Add comment to document the columns
COMMENT ON COLUMN "public"."booth_sales"."start_time" IS 'Start time of the booth sale in 24-hour format';
COMMENT ON COLUMN "public"."booth_sales"."end_time" IS 'End time of the booth sale in 24-hour format';
