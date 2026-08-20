# 월별 예산 구조 개선

> 작업일: 2026-08-20

## 문제

- 기존 동작: 사용자당 하나의 예산만 저장하고 모든 화면이 같은 값을 사용했다.
- 문제점: 과거 월 장부에서도 현재 예산이 표시되고 해당 월 예산을 별도로 관리할 수 없었다.
- 사용자 영향: 월별 예산 대비 지출과 예산 초과 결과가 실제 월 기준과 다를 수 있었다.

## 원인

- 원인: `budgets` 테이블과 API에 연·월 구분값이 없고 Neo4j 예산 노드도 사용자당 하나만 관리했다.
- 관련 파일/API/DB: `backend/routers/budget.py`, `backend/routers/expenses.py`, `backend/graph_rag.py`, `budgets`, `GET/POST /budget/`

## 수정

- 변경 내용: 예산을 사용자·연·월 단위로 저장하고 홈의 선택 월에서 설정·수정하도록 변경했다.
- 변경 파일: `budget.py`, `graph_rag.py`, `HomeScreen.tsx`, `BudgetModal.tsx`, `001_monthly_budgets.sql`
- 주요 로직 변경:
  - `GET /budget/?year={year}&month={month}` 조회 추가
  - `POST /budget/`에 `year`, `month` 추가
  - `(user_id, year, month)` 고유 인덱스 migration 작성
  - 기존 예산은 migration 실행 시점의 현재 월로 이관
  - 미설정과 조회 실패 상태 분리
  - 과거 월 예산은 Supabase에만 저장하고 Neo4j에는 현재 월 예산만 투영
  - 거래가 발생한 월을 기준으로 예산 초과 계산

## 검증

- [x] TypeScript 전체 검사
- [x] Python 구문 검사
- [x] migration 이후 누락·중복·RLS·인덱스 확인용 SQL 작성
- [x] 과거 월 저장 시 Neo4j 현재 월 예산을 덮지 않는 조건 확인
- [ ] 테스트 Supabase에 migration 적용
- [ ] RLS 기반 월별 예산 조회·등록·수정
- [ ] 기존 예산 데이터 이관 결과 확인
- [ ] 홈에서 선택 월 예산 진행률 실제 화면 확인

## 결과

- 개선 후 동작: 선택한 월별로 예산을 분리하고 홈에서 해당 월 예산을 관리하도록 구현했다.
- 남은 문제: Backend 배포 전에 migration 적용과 RLS 검증이 반드시 필요하다.

## Commit

- 작성하지 않음
