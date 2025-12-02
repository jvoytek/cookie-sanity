-- Fix overlapping permissive policies for seasons and season_collaborators tables
-- This migration removes "FOR ALL" policies that overlap with specific operation policies

-- Drop existing policies for seasons table
DROP POLICY IF EXISTS "Allow owners to manage their own seasons" ON "public"."seasons";
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own seasons" ON "public"."seasons";
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own seasons" ON "public"."seasons";
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own seasons" ON "public"."seasons";

-- Create new non-overlapping policies for seasons table
CREATE POLICY "Allow owners to insert their own seasons"
ON "public"."seasons"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (profile = auth.uid());

CREATE POLICY "Allow owners/collaborators to view their own seasons"
ON "public"."seasons"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.is_season_owner(id, auth.uid()) OR public.is_season_collaborator(id, auth.uid()));

CREATE POLICY "Allow owners/collaborators to update their own seasons"
ON "public"."seasons"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (public.is_season_owner(id, auth.uid()) OR public.is_season_collaborator(id, auth.uid()));

CREATE POLICY "Allow owners/collaborators to delete their own seasons"
ON "public"."seasons"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (public.is_season_owner(id, auth.uid()) OR public.is_season_collaborator(id, auth.uid()));

-- Drop existing policies for season_collaborators table
DROP POLICY IF EXISTS "Season owners can manage collaborators" ON "public"."season_collaborators";
DROP POLICY IF EXISTS "Collaborators can view their own record" ON "public"."season_collaborators";

-- Create new non-overlapping policies for season_collaborators table
CREATE POLICY "Season owners can insert collaborators"
ON "public"."season_collaborators"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.seasons 
        WHERE seasons.id = season_collaborators.season_id 
        AND seasons.profile = auth.uid()
    )
);

CREATE POLICY "Season owners can update collaborators"
ON "public"."season_collaborators"
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.seasons 
        WHERE seasons.id = season_collaborators.season_id 
        AND seasons.profile = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.seasons 
        WHERE seasons.id = season_collaborators.season_id 
        AND seasons.profile = auth.uid()
    )
);

CREATE POLICY "Season owners can delete collaborators"
ON "public"."season_collaborators"
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.seasons 
        WHERE seasons.id = season_collaborators.season_id 
        AND seasons.profile = auth.uid()
    )
);

CREATE POLICY "Season owners/collaborators can view collaborators"
ON "public"."season_collaborators"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
    profile_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.seasons 
        WHERE seasons.id = season_collaborators.season_id 
        AND seasons.profile = auth.uid()
    )
);
