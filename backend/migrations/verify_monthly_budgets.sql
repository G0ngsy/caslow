-- 001_monthly_budgets.sql 적용 후 읽기 전용 검증 쿼리

-- 1. year/month 누락 행: 0건이어야 한다.
select count(*) as missing_period_count
from public.budgets
where year is null or month is null;

-- 2. 사용자/연/월 중복: 결과가 없어야 한다.
select user_id, year, month, count(*) as duplicate_count
from public.budgets
group by user_id, year, month
having count(*) > 1;

-- 3. 월 범위 오류: 0건이어야 한다.
select count(*) as invalid_month_count
from public.budgets
where month not between 1 and 12;

-- 4. budgets 테이블의 RLS 활성화 여부를 확인한다.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename = 'budgets';

-- 5. budgets 테이블 정책을 확인한다. 사용자별 SELECT/INSERT/UPDATE 정책이 있어야 한다.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'budgets'
order by policyname;

-- 6. 월별 고유 인덱스가 존재하는지 확인한다.
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'budgets'
  and indexname = 'budgets_user_year_month_uidx';
