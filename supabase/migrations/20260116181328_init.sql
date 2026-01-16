create extension if not exists "pgjwt" with schema "extensions";


  create table "public"."cookie_defaults" (
    "id" uuid not null default gen_random_uuid(),
    "profile" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "defaults" jsonb not null default '{}'::jsonb
      );


alter table "public"."cookie_defaults" enable row level security;

alter table "public"."profiles" add column "is_admin" boolean default false;

CREATE UNIQUE INDEX cookie_defaults_pkey ON public.cookie_defaults USING btree (id);

alter table "public"."cookie_defaults" add constraint "cookie_defaults_pkey" PRIMARY KEY using index "cookie_defaults_pkey";

alter table "public"."cookie_defaults" add constraint "cookie_defaults_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."cookie_defaults" validate constraint "cookie_defaults_profile_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.is_admin(p_profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = p_profile_id
          AND profiles.is_admin = true
    );
$function$
;

grant delete on table "public"."cookie_defaults" to "anon";

grant insert on table "public"."cookie_defaults" to "anon";

grant references on table "public"."cookie_defaults" to "anon";

grant select on table "public"."cookie_defaults" to "anon";

grant trigger on table "public"."cookie_defaults" to "anon";

grant truncate on table "public"."cookie_defaults" to "anon";

grant update on table "public"."cookie_defaults" to "anon";

grant delete on table "public"."cookie_defaults" to "authenticated";

grant insert on table "public"."cookie_defaults" to "authenticated";

grant references on table "public"."cookie_defaults" to "authenticated";

grant select on table "public"."cookie_defaults" to "authenticated";

grant trigger on table "public"."cookie_defaults" to "authenticated";

grant truncate on table "public"."cookie_defaults" to "authenticated";

grant update on table "public"."cookie_defaults" to "authenticated";

grant delete on table "public"."cookie_defaults" to "service_role";

grant insert on table "public"."cookie_defaults" to "service_role";

grant references on table "public"."cookie_defaults" to "service_role";

grant select on table "public"."cookie_defaults" to "service_role";

grant trigger on table "public"."cookie_defaults" to "service_role";

grant truncate on table "public"."cookie_defaults" to "service_role";

grant update on table "public"."cookie_defaults" to "service_role";


  create policy "Allow admin users to delete cookie defaults"
  on "public"."cookie_defaults"
  as permissive
  for delete
  to authenticated
using (public.is_admin(( SELECT auth.uid() AS uid)));



  create policy "Allow admin users to insert cookie defaults"
  on "public"."cookie_defaults"
  as permissive
  for insert
  to authenticated
with check (public.is_admin(( SELECT auth.uid() AS uid)));



  create policy "Allow admin users to update cookie defaults"
  on "public"."cookie_defaults"
  as permissive
  for update
  to authenticated
using (public.is_admin(( SELECT auth.uid() AS uid)));



  create policy "Cookie defaults are viewable by all authenticated users"
  on "public"."cookie_defaults"
  as permissive
  for select
  to authenticated
using (true);



