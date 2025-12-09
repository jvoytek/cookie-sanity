alter table "public"."seasons" add column "publish_girl_request_form" boolean default false;

alter table "public"."sellers" add column "email" text;

create or replace view "public"."seller_requests" 
with (security_invoker = on) AS 
SELECT 
    s.id,
    s.first_name,
    s.season
   FROM (public.sellers s
     JOIN public.seasons se ON ((s.season = se.id)))
  WHERE (se.publish_girl_request_form = true);


  create policy "Allow public to view cookies for request forms"
  on "public"."cookies"
  as permissive
  for select
  to anon
using ((EXISTS ( SELECT 1
   FROM public.seasons
  WHERE ((seasons.id = cookies.season) AND (seasons.publish_girl_request_form = true)))));


  create policy "Allow public to insert cookie requests"
  on "public"."orders"
  as permissive
  for insert
  to anon
with check ((((status)::text = 'requested'::text) AND ((type)::text = 'T2G'::text) AND ("to" IN ( SELECT seller_requests.id
   FROM public.seller_requests))));



  create policy "Allow anonymous users to read seasons"
  on "public"."seasons"
  as permissive
  for select
  to anon
using (true);



  create policy "Allow public read of id, first_name, and season"
  on "public"."sellers"
  as permissive
  for select
  to public
using ((id > 0));



