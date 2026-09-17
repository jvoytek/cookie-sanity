alter table "public"."sellers"
add column "program_level" text;

alter table "public"."sellers"
add constraint "sellers_program_level_check"
check (
  "program_level" is null
  or "program_level" = any (
    array[
      'daisy'::text,
      'brownie'::text,
      'junior'::text,
      'cadette'::text,
      'senior'::text,
      'ambassador'::text
    ]
  )
);
