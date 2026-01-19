-- Add in_projections column to booth_sales table
-- This flag determines whether booth sales are included in inventory projections
ALTER TABLE "public"."booth_sales" 
ADD COLUMN "in_projections" boolean NOT NULL DEFAULT true;

-- Add comment to document the column purpose
COMMENT ON COLUMN "public"."booth_sales"."in_projections" IS 'Flag to determine if this booth sale should be included in inventory projections. Defaults to true.';
