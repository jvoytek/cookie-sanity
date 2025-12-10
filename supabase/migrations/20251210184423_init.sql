alter table "public"."audit_sessions" add column "season" bigint not null default '1'::bigint;

alter table "public"."audit_sessions" add constraint "audit_sessions_season_fkey" FOREIGN KEY (season) REFERENCES public.seasons(id) ON DELETE CASCADE not valid;

alter table "public"."audit_sessions" validate constraint "audit_sessions_season_fkey";


