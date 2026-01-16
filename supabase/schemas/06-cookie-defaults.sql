CREATE TABLE IF NOT EXISTS "public"."cookie_defaults" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "profile" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "name" text NOT NULL,
    "defaults" jsonb NOT NULL DEFAULT '{}'::jsonb,
    constraint "cookie_defaults_pkey" primary key ("id"),
    constraint "cookie_defaults_profile_fkey" foreign key ("profile") references "public"."profiles"("id") on delete cascade
);

-- Enable row level security
alter table "public"."cookie_defaults" enable row level security;

-- RLS Policies for cookie_defaults
CREATE POLICY "Cookie defaults are viewable by all authenticated users"
ON public.cookie_defaults FOR SELECT
TO authenticated
USING ( true );

CREATE POLICY "Allow admin users to insert cookie defaults" 
ON public.cookie_defaults 
FOR INSERT 
TO authenticated 
WITH CHECK ( public.is_admin((SELECT auth.uid())));

CREATE POLICY "Allow admin users to update cookie defaults" 
ON public.cookie_defaults 
FOR UPDATE 
TO authenticated 
USING ( public.is_admin((SELECT auth.uid())));

CREATE POLICY "Allow admin users to delete cookie defaults" 
ON public.cookie_defaults 
FOR DELETE 
TO authenticated 
USING ( public.is_admin((SELECT auth.uid())));