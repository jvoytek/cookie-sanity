drop policy "Allow owners/collaborators to delete their own boothsales" on "public"."booth_sales";

drop policy "Allow owners/collaborators to insert their own boothsales" on "public"."booth_sales";

drop policy "Allow owners/collaborators to update their own boothsales" on "public"."booth_sales";

drop policy "Allow owners/collaborators to view their own boothsales" on "public"."booth_sales";

drop policy "Allow owners/collaborators to delete their own cookies" on "public"."cookies";

drop policy "Allow owners/collaborators to insert their own cookies" on "public"."cookies";

drop policy "Allow owners/collaborators to update their own cookies" on "public"."cookies";

drop policy "Allow owners/collaborators to view their own cookies" on "public"."cookies";

drop policy "Allow owners/collaborators to delete their own inventory checks" on "public"."inventory_checks";

drop policy "Allow owners/collaborators to insert their own inventory checks" on "public"."inventory_checks";

drop policy "Allow owners/collaborators to update their own inventory checks" on "public"."inventory_checks";

drop policy "Allow owners/collaborators to view their own inventory checks" on "public"."inventory_checks";

drop policy "Allow owners/collaborators to delete their own orders" on "public"."orders";

drop policy "Allow owners/collaborators to insert their own orders" on "public"."orders";

drop policy "Allow owners/collaborators to update their own orders" on "public"."orders";

drop policy "Allow owners/collaborators to view their own orders" on "public"."orders";

drop policy "Allow owners/collaborators to delete their own payments" on "public"."payments";

drop policy "Allow owners/collaborators to insert their own payments" on "public"."payments";

drop policy "Allow owners/collaborators to update their own payments" on "public"."payments";

drop policy "Allow owners/collaborators to view their own payments" on "public"."payments";

drop policy "Collaborators can view their own record" on "public"."season_collaborators";

drop policy "Season owners can manage collaborators" on "public"."season_collaborators";

drop policy "Allow owners to manage their own seasons" on "public"."seasons";

drop policy "Allow owners/collaborators to delete their own seasons" on "public"."seasons";

drop policy "Allow owners/collaborators to update their own seasons" on "public"."seasons";

drop policy "Allow owners/collaborators to view their own seasons" on "public"."seasons";

drop policy "Allow owners/collaborators to delete their own sellers" on "public"."sellers";

drop policy "Allow owners/collaborators to insert their own sellers" on "public"."sellers";

drop policy "Allow owners/collaborators to update their own sellers" on "public"."sellers";

drop policy "Allow owners/collaborators to view their own sellers" on "public"."sellers";

alter table "public"."cookies" drop constraint "cookies_profile_fkey";

alter table "public"."cookies" drop constraint "cookies_season_fkey";

alter table "public"."orders" drop constraint "orders_profile_fkey";

alter table "public"."orders" drop constraint "orders_season_fkey";

alter table "public"."orders" drop constraint "orders_to_fkey";

alter table "public"."seasons" drop constraint "seasons_profile_fkey";

alter table "public"."sellers" drop constraint "sellers_profile_fkey";

alter table "public"."sellers" drop constraint "sellers_season_fkey";

alter table "public"."uploads" drop constraint "uploads_profile_fkey";

alter table "public"."uploads" drop constraint "uploads_season_fkey";

alter table "public"."orders" add constraint "orders_from_fkey" FOREIGN KEY ("from") REFERENCES public.sellers(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_from_fkey";

alter table "public"."cookies" add constraint "cookies_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."cookies" validate constraint "cookies_profile_fkey";

alter table "public"."cookies" add constraint "cookies_season_fkey" FOREIGN KEY (season) REFERENCES public.seasons(id) ON DELETE CASCADE not valid;

alter table "public"."cookies" validate constraint "cookies_season_fkey";

alter table "public"."orders" add constraint "orders_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_profile_fkey";

alter table "public"."orders" add constraint "orders_season_fkey" FOREIGN KEY (season) REFERENCES public.seasons(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_season_fkey";

alter table "public"."orders" add constraint "orders_to_fkey" FOREIGN KEY ("to") REFERENCES public.sellers(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_to_fkey";

alter table "public"."seasons" add constraint "seasons_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."seasons" validate constraint "seasons_profile_fkey";

alter table "public"."sellers" add constraint "sellers_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."sellers" validate constraint "sellers_profile_fkey";

alter table "public"."sellers" add constraint "sellers_season_fkey" FOREIGN KEY (season) REFERENCES public.seasons(id) ON DELETE CASCADE not valid;

alter table "public"."sellers" validate constraint "sellers_season_fkey";

alter table "public"."uploads" add constraint "uploads_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."uploads" validate constraint "uploads_profile_fkey";

alter table "public"."uploads" add constraint "uploads_season_fkey" FOREIGN KEY (season) REFERENCES public.seasons(id) ON DELETE CASCADE not valid;

alter table "public"."uploads" validate constraint "uploads_season_fkey";


  create policy "Allow owners/collaborators to delete their own boothsales"
  on "public"."booth_sales"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to insert their own boothsales"
  on "public"."booth_sales"
  as permissive
  for insert
  to authenticated
with check ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own boothsales"
  on "public"."booth_sales"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own boothsales"
  on "public"."booth_sales"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to delete their own cookies"
  on "public"."cookies"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to insert their own cookies"
  on "public"."cookies"
  as permissive
  for insert
  to authenticated
with check ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own cookies"
  on "public"."cookies"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own cookies"
  on "public"."cookies"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to delete their own inventory checks"
  on "public"."inventory_checks"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to insert their own inventory checks"
  on "public"."inventory_checks"
  as permissive
  for insert
  to authenticated
with check ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own inventory checks"
  on "public"."inventory_checks"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own inventory checks"
  on "public"."inventory_checks"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to delete their own orders"
  on "public"."orders"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to insert their own orders"
  on "public"."orders"
  as permissive
  for insert
  to authenticated
with check ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own orders"
  on "public"."orders"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own orders"
  on "public"."orders"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to delete their own payments"
  on "public"."payments"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to insert their own payments"
  on "public"."payments"
  as permissive
  for insert
  to authenticated
with check ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own payments"
  on "public"."payments"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own payments"
  on "public"."payments"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Collaborators can view their own record"
  on "public"."season_collaborators"
  as permissive
  for select
  to authenticated
using ((profile_id = ( SELECT auth.uid() AS uid)));



  create policy "Season owners can manage collaborators"
  on "public"."season_collaborators"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = season_collaborators.season_id) AND (seasons.profile = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = season_collaborators.season_id) AND (seasons.profile = ( SELECT auth.uid() AS uid))))));



  create policy "Allow owners to manage their own seasons"
  on "public"."seasons"
  as permissive
  for all
  to authenticated
using ((profile = ( SELECT auth.uid() AS uid)))
with check ((profile = ( SELECT auth.uid() AS uid)));



  create policy "Allow owners/collaborators to delete their own seasons"
  on "public"."seasons"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(id, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(id, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own seasons"
  on "public"."seasons"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(id, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(id, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own seasons"
  on "public"."seasons"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(id, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(id, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to delete their own sellers"
  on "public"."sellers"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to insert their own sellers"
  on "public"."sellers"
  as permissive
  for insert
  to authenticated
with check ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own sellers"
  on "public"."sellers"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own sellers"
  on "public"."sellers"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



