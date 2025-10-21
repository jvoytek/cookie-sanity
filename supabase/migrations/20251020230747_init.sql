ALTER TABLE "public"."seasons"
ADD COLUMN just_year int;

-- Populate the new column with the year extracted from the old date column
UPDATE "public"."seasons"
SET just_year = EXTRACT(YEAR FROM year);

-- Remove the old column (Optional, uncomment if you no longer need it)
ALTER TABLE "public"."seasons"
DROP COLUMN year;
ALTER TABLE "public"."seasons" RENAME COLUMN just_year TO year;