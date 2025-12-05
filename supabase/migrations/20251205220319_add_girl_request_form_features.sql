-- Add publish_girl_request_form column to seasons table
ALTER TABLE "public"."seasons"
ADD COLUMN IF NOT EXISTS "publish_girl_request_form" boolean DEFAULT false;

-- Add email column to sellers table
ALTER TABLE "public"."sellers"
ADD COLUMN IF NOT EXISTS "email" text;

-- Create seller_requests view to expose limited seller information for public requests
CREATE OR REPLACE VIEW "public"."seller_requests" AS
SELECT 
    s.id,
    s.first_name,
    s.season
FROM "public"."sellers" s
INNER JOIN "public"."seasons" se ON s.season = se.id
WHERE se.publish_girl_request_form = true;

-- Allow public to SELECT from cookies table (needed for request form)
CREATE POLICY "Allow public to view cookies for request forms"
ON "public"."cookies"
FOR SELECT
TO anon
USING (
    EXISTS (
        SELECT 1 FROM public.seasons
        WHERE public.seasons.id = cookies.season
        AND public.seasons.publish_girl_request_form = true
    )
);

-- Allow public to INSERT into orders table with status='requested' for known girl IDs
CREATE POLICY "Allow public to insert cookie requests"
ON "public"."orders"
FOR INSERT
TO anon
WITH CHECK (
    status = 'requested'
    AND type = 'T2G'
    AND "to" IN (SELECT id FROM public.seller_requests)
);

-- Grant SELECT permission on seller_requests view to anon
GRANT SELECT ON "public"."seller_requests" TO anon;
