drop policy "Collaborators can view their own record" on "public"."season_collaborators";

drop policy "Season owners can manage collaborators" on "public"."season_collaborators";

drop policy "Allow owners to manage their own seasons" on "public"."seasons";


  create policy "Season owners can delete collaborators"
  on "public"."season_collaborators"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = season_collaborators.season_id) AND (seasons.profile = auth.uid())))));



  create policy "Season owners can insert collaborators"
  on "public"."season_collaborators"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = season_collaborators.season_id) AND (seasons.profile = auth.uid())))));



  create policy "Season owners can update collaborators"
  on "public"."season_collaborators"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = season_collaborators.season_id) AND (seasons.profile = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = season_collaborators.season_id) AND (seasons.profile = ( SELECT auth.uid() AS uid))))));



  create policy "Season owners/collaborators can view collaborators"
  on "public"."season_collaborators"
  as permissive
  for select
  to authenticated
using (((profile_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = season_collaborators.season_id) AND (seasons.profile = ( SELECT auth.uid() AS uid)))))));



  create policy "Allow owners to insert their own seasons"
  on "public"."seasons"
  as permissive
  for insert
  to authenticated
with check ((profile = auth.uid()));



