alter table "public"."booth_sales" add column "status" text;

alter table "public"."booth_sales" add constraint "booth_sales_status_check" CHECK (((status IS NULL) OR (status = 'archived'::text))) not valid;

alter table "public"."booth_sales" validate constraint "booth_sales_status_check";


