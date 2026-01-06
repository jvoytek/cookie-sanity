-- Add cash_receipts and cash_breakdown columns to booth_sales table
alter table "public"."booth_sales" add column "cash_receipts" double precision;
alter table "public"."booth_sales" add column "cash_breakdown" jsonb;
