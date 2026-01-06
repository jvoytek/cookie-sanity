-- Add credit_receipts and other_receipts columns to booth_sales table
alter table booth_sales add column credit_receipts double precision;
alter table booth_sales add column other_receipts double precision;
