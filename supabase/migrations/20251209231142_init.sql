
  create table "public"."audit_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "profile" uuid not null,
    "file_name" text not null,
    "file_size" integer not null,
    "created_at" timestamp with time zone not null default now(),
    "status" text not null default 'pending'::text,
    "original_file_data" jsonb not null,
    "parsed_rows" jsonb not null default '[]'::jsonb
      );


alter table "public"."audit_sessions" enable row level security;

CREATE INDEX audit_sessions_created_at_idx ON public.audit_sessions USING btree (created_at);

CREATE UNIQUE INDEX audit_sessions_pkey ON public.audit_sessions USING btree (id);

CREATE INDEX audit_sessions_profile_idx ON public.audit_sessions USING btree (profile);

CREATE INDEX audit_sessions_status_idx ON public.audit_sessions USING btree (status);

alter table "public"."audit_sessions" add constraint "audit_sessions_pkey" PRIMARY KEY using index "audit_sessions_pkey";

alter table "public"."audit_sessions" add constraint "audit_sessions_profile_fkey" FOREIGN KEY (profile) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."audit_sessions" validate constraint "audit_sessions_profile_fkey";

alter table "public"."audit_sessions" add constraint "audit_sessions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'complete'::text, 'archived'::text]))) not valid;

alter table "public"."audit_sessions" validate constraint "audit_sessions_status_check";

grant delete on table "public"."audit_sessions" to "anon";

grant insert on table "public"."audit_sessions" to "anon";

grant references on table "public"."audit_sessions" to "anon";

grant select on table "public"."audit_sessions" to "anon";

grant trigger on table "public"."audit_sessions" to "anon";

grant truncate on table "public"."audit_sessions" to "anon";

grant update on table "public"."audit_sessions" to "anon";

grant delete on table "public"."audit_sessions" to "authenticated";

grant insert on table "public"."audit_sessions" to "authenticated";

grant references on table "public"."audit_sessions" to "authenticated";

grant select on table "public"."audit_sessions" to "authenticated";

grant trigger on table "public"."audit_sessions" to "authenticated";

grant truncate on table "public"."audit_sessions" to "authenticated";

grant update on table "public"."audit_sessions" to "authenticated";

grant delete on table "public"."audit_sessions" to "service_role";

grant insert on table "public"."audit_sessions" to "service_role";

grant references on table "public"."audit_sessions" to "service_role";

grant select on table "public"."audit_sessions" to "service_role";

grant trigger on table "public"."audit_sessions" to "service_role";

grant truncate on table "public"."audit_sessions" to "service_role";

grant update on table "public"."audit_sessions" to "service_role";


  create policy "Allow users to delete their own audit sessions"
  on "public"."audit_sessions"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = profile));



  create policy "Allow users to insert their own audit sessions"
  on "public"."audit_sessions"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = profile));



  create policy "Allow users to update their own audit sessions"
  on "public"."audit_sessions"
  as permissive
  for update
  to authenticated
using ((auth.uid() = profile));



  create policy "Allow users to view their own audit sessions"
  on "public"."audit_sessions"
  as permissive
  for select
  to authenticated
using ((auth.uid() = profile));



