drop policy "Allow owners/collaborators to delete their own adults" on "public"."adults";

drop policy "Allow owners/collaborators to insert their own adults" on "public"."adults";

drop policy "Allow owners/collaborators to update their own adults" on "public"."adults";

drop policy "Allow owners/collaborators to view their own adults" on "public"."adults";

revoke delete on table "public"."audit_sessions" from "anon";

revoke insert on table "public"."audit_sessions" from "anon";

revoke select on table "public"."audit_sessions" from "anon";

revoke update on table "public"."audit_sessions" from "anon";

revoke delete on table "public"."audit_sessions" from "authenticated";

revoke insert on table "public"."audit_sessions" from "authenticated";

revoke select on table "public"."audit_sessions" from "authenticated";

revoke update on table "public"."audit_sessions" from "authenticated";

revoke delete on table "public"."audit_sessions" from "service_role";

revoke insert on table "public"."audit_sessions" from "service_role";

revoke select on table "public"."audit_sessions" from "service_role";

revoke update on table "public"."audit_sessions" from "service_role";

revoke delete on table "public"."booth_sales" from "anon";

revoke insert on table "public"."booth_sales" from "anon";

revoke select on table "public"."booth_sales" from "anon";

revoke update on table "public"."booth_sales" from "anon";

revoke delete on table "public"."booth_sales" from "authenticated";

revoke insert on table "public"."booth_sales" from "authenticated";

revoke select on table "public"."booth_sales" from "authenticated";

revoke update on table "public"."booth_sales" from "authenticated";

revoke delete on table "public"."booth_sales" from "service_role";

revoke insert on table "public"."booth_sales" from "service_role";

revoke select on table "public"."booth_sales" from "service_role";

revoke update on table "public"."booth_sales" from "service_role";

revoke delete on table "public"."cookie_defaults" from "anon";

revoke insert on table "public"."cookie_defaults" from "anon";

revoke select on table "public"."cookie_defaults" from "anon";

revoke update on table "public"."cookie_defaults" from "anon";

revoke delete on table "public"."cookie_defaults" from "authenticated";

revoke insert on table "public"."cookie_defaults" from "authenticated";

revoke select on table "public"."cookie_defaults" from "authenticated";

revoke update on table "public"."cookie_defaults" from "authenticated";

revoke delete on table "public"."cookie_defaults" from "service_role";

revoke insert on table "public"."cookie_defaults" from "service_role";

revoke select on table "public"."cookie_defaults" from "service_role";

revoke update on table "public"."cookie_defaults" from "service_role";

revoke delete on table "public"."deposits" from "anon";

revoke insert on table "public"."deposits" from "anon";

revoke select on table "public"."deposits" from "anon";

revoke update on table "public"."deposits" from "anon";

revoke delete on table "public"."deposits" from "authenticated";

revoke insert on table "public"."deposits" from "authenticated";

revoke select on table "public"."deposits" from "authenticated";

revoke update on table "public"."deposits" from "authenticated";

revoke delete on table "public"."deposits" from "service_role";

revoke insert on table "public"."deposits" from "service_role";

revoke select on table "public"."deposits" from "service_role";

revoke update on table "public"."deposits" from "service_role";

revoke delete on table "public"."inventory_checks" from "anon";

revoke insert on table "public"."inventory_checks" from "anon";

revoke select on table "public"."inventory_checks" from "anon";

revoke update on table "public"."inventory_checks" from "anon";

revoke delete on table "public"."inventory_checks" from "authenticated";

revoke insert on table "public"."inventory_checks" from "authenticated";

revoke select on table "public"."inventory_checks" from "authenticated";

revoke update on table "public"."inventory_checks" from "authenticated";

revoke delete on table "public"."inventory_checks" from "service_role";

revoke insert on table "public"."inventory_checks" from "service_role";

revoke select on table "public"."inventory_checks" from "service_role";

revoke update on table "public"."inventory_checks" from "service_role";

revoke delete on table "public"."payments" from "anon";

revoke insert on table "public"."payments" from "anon";

revoke select on table "public"."payments" from "anon";

revoke update on table "public"."payments" from "anon";

revoke delete on table "public"."payments" from "authenticated";

revoke insert on table "public"."payments" from "authenticated";

revoke select on table "public"."payments" from "authenticated";

revoke update on table "public"."payments" from "authenticated";

revoke delete on table "public"."payments" from "service_role";

revoke insert on table "public"."payments" from "service_role";

revoke select on table "public"."payments" from "service_role";

revoke update on table "public"."payments" from "service_role";

revoke delete on table "public"."season_collaborators" from "anon";

revoke insert on table "public"."season_collaborators" from "anon";

revoke select on table "public"."season_collaborators" from "anon";

revoke update on table "public"."season_collaborators" from "anon";


  create table "public"."events" (
    "id" bigint generated by default as identity not null,
    "created_at" timestamp with time zone not null default now(),
    "profile" uuid,
    "name" character varying not null,
    "start_date" date not null,
    "end_date" date not null,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "forms" bigint[] not null default '{}'::bigint[],
    "girls" bigint[] not null default '{}'::bigint[],
    "adults" bigint[] not null default '{}'::bigint[],
    "season" bigint not null
      );


alter table "public"."events" enable row level security;

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."events" add constraint "events_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_profile_fkey";

alter table "public"."events" add constraint "events_season_fkey" FOREIGN KEY (season) REFERENCES public.seasons(id) ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_season_fkey";

grant references on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant references on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant references on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";


  create policy "Allow owners/collaborators to delete their own events"
  on "public"."events"
  as permissive
  for delete
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to insert their own events"
  on "public"."events"
  as permissive
  for insert
  to authenticated
with check ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to update their own events"
  on "public"."events"
  as permissive
  for update
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



  create policy "Allow owners/collaborators to view their own events"
  on "public"."events"
  as permissive
  for select
  to authenticated
using ((public.is_season_owner(season, ( SELECT auth.uid() AS uid)) OR public.is_season_collaborator(season, ( SELECT auth.uid() AS uid))));



