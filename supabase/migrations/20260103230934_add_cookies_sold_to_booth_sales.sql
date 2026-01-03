-- Add cookies_sold column to booth_sales table to record actual sales from booth
alter table "public"."booth_sales" add column "cookies_sold" jsonb;
