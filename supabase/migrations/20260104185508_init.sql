alter table "public"."booth_sales" drop constraint "booth_sales_status_check";

alter table "public"."booth_sales" add constraint "booth_sales_status_check" CHECK (((status IS NULL) OR (status = ANY (ARRAY['archived'::text, 'pending'::text])))) not valid;

alter table "public"."booth_sales" validate constraint "booth_sales_status_check";


