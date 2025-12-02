-- Add fields to seasons table for girl request form feature
ALTER TABLE "public"."seasons"
ADD COLUMN IF NOT EXISTS "publish_girl_request_form" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "girl_request_form_password" text;
