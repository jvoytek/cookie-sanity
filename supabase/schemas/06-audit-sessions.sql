-- Create audit_sessions table for storing uploaded file information and parsed rows for persistent audits
CREATE TABLE IF NOT EXISTS "public"."audit_sessions" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "file_name" text NOT NULL,
    "file_size" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "status" text NOT NULL DEFAULT 'pending',
    "original_file_data" jsonb NOT NULL,
    "parsed_rows" jsonb NOT NULL DEFAULT '[]'::jsonb,
    constraint "audit_sessions_pkey" primary key ("id"),
    constraint "audit_sessions_user_id_fkey" foreign key ("user_id") references "public"."profiles"("id") on delete cascade,
    constraint "audit_sessions_status_check" check (status IN ('pending', 'complete', 'archived'))
);

-- Add comment to explain the table purpose
COMMENT ON TABLE "public"."audit_sessions" IS 'Stores uploaded file information and parsed rows for persistent audit sessions to reconcile Smart Cookies data';

-- Enable row level security
alter table "public"."audit_sessions" enable row level security;

-- Create indexes for better performance
create index "audit_sessions_user_id_idx" on "public"."audit_sessions" using btree ("user_id");
create index "audit_sessions_created_at_idx" on "public"."audit_sessions" using btree ("created_at");
create index "audit_sessions_status_idx" on "public"."audit_sessions" using btree ("status");

-- RLS Policies for audit_sessions
CREATE POLICY "Allow users to view their own audit sessions" 
ON public.audit_sessions 
FOR SELECT 
TO authenticated 
USING ( auth.uid() = user_id );

CREATE POLICY "Allow users to insert their own audit sessions" 
ON public.audit_sessions 
FOR INSERT 
TO authenticated 
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Allow users to update their own audit sessions" 
ON public.audit_sessions 
FOR UPDATE 
TO authenticated 
USING ( auth.uid() = user_id );

CREATE POLICY "Allow users to delete their own audit sessions" 
ON public.audit_sessions 
FOR DELETE 
TO authenticated 
USING ( auth.uid() = user_id );
