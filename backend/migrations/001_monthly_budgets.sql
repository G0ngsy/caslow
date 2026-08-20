-- budgets를 사용자당 1개에서 사용자/연/월당 1개로 확장한다.
-- 애플리케이션 배포 전에 Supabase SQL Editor에서 먼저 실행한다.

alter table public.budgets
  add column if not exists year integer,
  add column if not exists month integer;

update public.budgets
set
  year = coalesce(year, extract(year from current_date)::integer),
  month = coalesce(month, extract(month from current_date)::integer)
where year is null or month is null;

alter table public.budgets
  alter column year set not null,
  alter column month set not null;

alter table public.budgets
  drop constraint if exists budgets_month_check,
  add constraint budgets_month_check check (month between 1 and 12);

-- 기존 user_id 단독 UNIQUE 제약이 있다면 제거한다.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'budgets'
      and c.contype = 'u'
      and (
        select array_agg(a.attname order by a.attname)
        from unnest(c.conkey) key(attnum)
        join pg_attribute a on a.attrelid = t.oid and a.attnum = key.attnum
      ) = array['user_id']::text[]
  loop
    execute format('alter table public.budgets drop constraint %I', constraint_name);
  end loop;
end $$;

create unique index if not exists budgets_user_year_month_uidx
  on public.budgets (user_id, year, month);
