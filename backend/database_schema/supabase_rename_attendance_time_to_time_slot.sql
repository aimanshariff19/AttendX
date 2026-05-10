-- Run once in Supabase SQL Editor.
-- PostgreSQL reserves `TIME` as a type name; PostgREST/Supabase JS often skips or mishandles reads/writes to column `time`.
-- Rename → `time_slot` so Table Editor shows the value and inserts persist.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'attendance'
      and column_name = 'time'
  ) then
    alter table attendance rename column time to time_slot;
  end if;
end $$;
