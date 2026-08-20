# 월별 장부 이동 개선

> 작업일: 2026-08-20

## 문제

- 기존 동작: 홈에서 시스템 현재 월 거래만 필터링하여 표시했다.
- 문제점: 이전·다음 월 이동 상태와 월별 API 조회 조건이 없었다.
- 사용자 영향: 과거 거래를 확인하거나 과거 월에서 거래를 추가한 뒤 해당 월 장부를 계속 볼 수 없었다.

## 원인

- 원인: Frontend가 현재 월 문자열로 거래를 고정 필터링하고 `GET /expenses/`가 연·월 조건을 받지 않았다.
- 관련 파일/API/DB: `frontend/src/screens/HomeScreen.tsx`, `frontend/src/lib/api.ts`, `backend/routers/expenses.py`, `GET /expenses/`

## 수정

- 변경 내용: 홈에 선택 월 상태, 이전·다음 월, 이번 달 이동 UI를 추가했다.
- 변경 파일: `HomeScreen.tsx`, `ExpenseFormScreen.tsx`, `ExpenseDetailScreen.tsx`, `expenses.py`, `date_utils.py`
- 주요 로직 변경:
  - `GET /expenses/?year={year}&month={month}` 월별 조회 추가
  - 월 시작 이상·다음 달 시작 미만 조건 적용
  - 현재 월 이후 이동 제한
  - 빠른 월 전환 시 이전 응답이 최신 화면을 덮지 않도록 요청 식별값 적용
  - 등록·수정 후 기존 선택 월로 복귀
  - 빈 달과 조회 오류·재시도 상태 추가

## 검증

- [x] TypeScript 전체 검사
- [x] Python 구문 검사
- [x] 12월 → 1월 및 1월 → 12월 날짜 계산 단위 테스트
- [x] 월 파라미터 동시 입력 및 범위 검증 코드 확인
- [ ] 실제 API를 통한 현재·과거 월 조회
- [ ] Android/iOS/Web 월 이동 화면 확인
- [ ] 느린 네트워크에서 요청 경합 확인

## 결과

- 개선 후 동작: 선택한 연·월을 기준으로 장부 조회, 합계 계산, 거래 등록·수정 복귀가 동작하도록 구현했다.
- 남은 문제: 실제 Supabase 데이터와 기기 화면을 사용한 통합 검증이 필요하다.

## Commit

- 작성하지 않음
