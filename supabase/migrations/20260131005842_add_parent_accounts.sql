-- Migration: Add parent accounts support to season_collaborators
-- This migration adds:
-- 1. all_access column (boolean, default false) - existing records set to true
-- 2. children column (int8[] array) - holds seller IDs for parent accounts

-- Add all_access column with default false
ALTER TABLE public.season_collaborators
ADD COLUMN all_access boolean DEFAULT false NOT NULL;

-- Set all existing season_collaborators to have all_access = true
UPDATE public.season_collaborators
SET all_access = true;

-- Add children column to store array of seller IDs
ALTER TABLE public.season_collaborators
ADD COLUMN children bigint[] DEFAULT NULL;

-- Update is_season_collaborator function to check all_access == true
CREATE OR REPLACE FUNCTION public.is_season_collaborator(p_season_id bigint, p_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.season_collaborators
    WHERE season_collaborators.season_id = p_season_id
      AND season_collaborators.profile_id = p_profile_id
      AND season_collaborators.all_access = true
  );
$$;

-- Create is_parent function to check if user is a parent (collaborator without all_access and with children)
CREATE OR REPLACE FUNCTION public.is_parent(p_season_id bigint, p_profile_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.season_collaborators
    WHERE season_collaborators.season_id = p_season_id
      AND season_collaborators.profile_id = p_profile_id
      AND season_collaborators.all_access = false
      AND season_collaborators.children IS NOT NULL
      AND array_length(season_collaborators.children, 1) > 0
  );
$$;

ALTER FUNCTION "public"."is_parent" OWNER TO "postgres";
