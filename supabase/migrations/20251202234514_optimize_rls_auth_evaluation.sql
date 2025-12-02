-- Optimize RLS policies to prevent auth.uid() re-evaluation
-- This migration wraps auth.uid() calls in SELECT subqueries to force single evaluation per query
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- Drop and recreate the base seasons policy
DROP POLICY IF EXISTS "Allow owners to manage their own seasons" ON public.seasons;

CREATE POLICY "Allow owners to manage their own seasons"
ON public.seasons
FOR ALL
TO authenticated
USING ( profile = (SELECT auth.uid()) )
WITH CHECK ( profile = (SELECT auth.uid()) );

-- Drop and recreate season_collaborators policies
DROP POLICY IF EXISTS "Season owners can manage collaborators" ON public.season_collaborators;
DROP POLICY IF EXISTS "Collaborators can view their own record" ON public.season_collaborators;

CREATE POLICY "Season owners can manage collaborators"
ON public.season_collaborators
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM seasons 
        WHERE seasons.id = season_collaborators.season_id 
        AND seasons.profile = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM seasons 
        WHERE seasons.id = season_collaborators.season_id 
        AND seasons.profile = (SELECT auth.uid())
    )
);

CREATE POLICY "Collaborators can view their own record"
ON public.season_collaborators
FOR SELECT
TO authenticated
USING (profile_id = (SELECT auth.uid()));

-- Drop and recreate seasons policies
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own seasons" ON public.seasons;
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own seasons" ON public.seasons;
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own seasons" ON public.seasons;

CREATE POLICY "Allow owners/collaborators to view their own seasons" 
ON public.seasons 
FOR SELECT 
TO authenticated 
USING ( 
    public.is_season_owner(id, (SELECT auth.uid())) 
    OR public.is_season_collaborator(id, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to delete their own seasons" 
ON public.seasons 
FOR DELETE 
TO authenticated 
USING ( 
    public.is_season_owner(id, (SELECT auth.uid())) 
    OR public.is_season_collaborator(id, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to update their own seasons" 
ON public.seasons 
FOR UPDATE 
TO authenticated 
USING ( 
    public.is_season_owner(id, (SELECT auth.uid())) 
    OR public.is_season_collaborator(id, (SELECT auth.uid())) 
);

-- Drop and recreate cookies policies
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own cookies" ON public.cookies;
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own cookies" ON public.cookies;
DROP POLICY IF EXISTS "Allow owners/collaborators to insert their own cookies" ON public.cookies;
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own cookies" ON public.cookies;

CREATE POLICY "Allow owners/collaborators to view their own cookies" 
ON public.cookies 
FOR SELECT 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to delete their own cookies" 
ON public.cookies 
FOR DELETE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to insert their own cookies" 
ON public.cookies 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to update their own cookies" 
ON public.cookies 
FOR UPDATE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

-- Drop and recreate sellers policies
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow owners/collaborators to insert their own sellers" ON public.sellers;
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own sellers" ON public.sellers;

CREATE POLICY "Allow owners/collaborators to view their own sellers" 
ON public.sellers 
FOR SELECT 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to delete their own sellers" 
ON public.sellers 
FOR DELETE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to insert their own sellers" 
ON public.sellers 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to update their own sellers" 
ON public.sellers 
FOR UPDATE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

-- Drop and recreate payments policies
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own payments" ON public.payments;
DROP POLICY IF EXISTS "Allow owners/collaborators to insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own payments" ON public.payments;

CREATE POLICY "Allow owners/collaborators to view their own payments" 
ON public.payments 
FOR SELECT 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to delete their own payments" 
ON public.payments 
FOR DELETE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to insert their own payments" 
ON public.payments 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to update their own payments" 
ON public.payments 
FOR UPDATE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

-- Drop and recreate booth_sales policies
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own boothsales" ON public.booth_sales;
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own boothsales" ON public.booth_sales;
DROP POLICY IF EXISTS "Allow owners/collaborators to insert their own boothsales" ON public.booth_sales;
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own boothsales" ON public.booth_sales;

CREATE POLICY "Allow owners/collaborators to view their own boothsales" 
ON public.booth_sales 
FOR SELECT 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to delete their own boothsales" 
ON public.booth_sales 
FOR DELETE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to insert their own boothsales" 
ON public.booth_sales 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to update their own boothsales" 
ON public.booth_sales 
FOR UPDATE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

-- Drop and recreate inventory_checks policies
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own inventory checks" ON public.inventory_checks;
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own inventory checks" ON public.inventory_checks;
DROP POLICY IF EXISTS "Allow owners/collaborators to insert their own inventory checks" ON public.inventory_checks;
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own inventory checks" ON public.inventory_checks;

CREATE POLICY "Allow owners/collaborators to view their own inventory checks" 
ON public.inventory_checks 
FOR SELECT 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to delete their own inventory checks" 
ON public.inventory_checks 
FOR DELETE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to insert their own inventory checks" 
ON public.inventory_checks 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to update their own inventory checks" 
ON public.inventory_checks 
FOR UPDATE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

-- Drop and recreate orders policies
DROP POLICY IF EXISTS "Allow owners/collaborators to view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow owners/collaborators to delete their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow owners/collaborators to insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow owners/collaborators to update their own orders" ON public.orders;

CREATE POLICY "Allow owners/collaborators to view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to delete their own orders" 
ON public.orders 
FOR DELETE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to insert their own orders" 
ON public.orders 
FOR INSERT 
TO authenticated 
WITH CHECK ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);

CREATE POLICY "Allow owners/collaborators to update their own orders" 
ON public.orders 
FOR UPDATE 
TO authenticated 
USING ( 
    public.is_season_owner(season, (SELECT auth.uid())) 
    OR public.is_season_collaborator(season, (SELECT auth.uid())) 
);
