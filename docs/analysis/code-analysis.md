# Caslow n8n 도입 전 기술 분석

이 문서는 실제 Frontend 화면 코드, API 클라이언트, FastAPI router, Supabase 접근, Neo4j 동기화, APScheduler 및 외부 API 호출을 확인한 결과다.

분석 제약:

- 저장소에 Supabase SQL migration/schema 파일이 없다.
- DB 구조는 실제 `.table(...)`, `select`, `insert`, `update` 호출에서 확인된 범위만 기술한다.
- 환경 변수와 외부 서비스 연결 상태가 없어 Groq, Neo4j, SendGrid, Expo Push의 운영 환경 실행은 정적 코드 연결을 기준으로 판단했다.
- 별도의 Service, Repository, ORM 계층은 없다. FastAPI router가 Supabase Python SDK를 직접 호출한다.

---

## 1. 프로젝트 전체 구조

### Architecture

```text
Expo React Native / React Native Web
  │
  ├─ Supabase Auth 직접 호출
  │    └─ 회원가입·로그인·세션·비밀번호 재설정
  │
  └─ Bearer access token
            ↓
FastAPI
  ├─ Supabase PostgreSQL
  │    └─ 업무 데이터의 원본 저장소
  │
  ├─ Neo4j Aura
  │    └─ AI 검색용 파생 그래프
  │
  ├─ Groq
  │    ├─ AI 채팅·소비 분석·목표 조언
  │    ├─ 영수증 Vision OCR
  │    └─ Excel/CSV 거래 분석
  │
  ├─ Expo Push API
  │    └─ 예산 초과 푸시
  │
  ├─ SendGrid
  │    └─ AI 소비 조언 이메일
  │
  └─ APScheduler
       ├─ 정기 지출 생성
       └─ 일일 이메일 실행
```

Frontend는 일반 React 웹이 아니라 Expo 기반 React Native 앱이며 `react-native-web`을 통한 웹 실행도 지원한다.

### 주요 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Expo 54, React 19, React Native 0.81, TypeScript |
| Navigation | React Navigation Bottom Tabs, Native Stack |
| 상태 관리 | `useState`, `useEffect`, `useFocusEffect` |
| 인증 | Supabase Auth |
| Backend | FastAPI, Pydantic, Uvicorn |
| 주 DB | Supabase PostgreSQL |
| 보조 DB | Neo4j Aura |
| AI | Groq LLaMA 3.3 70B, LLaMA 4 Scout Vision |
| 파일 처리 | Pandas, OpenPyXL |
| 스케줄 | APScheduler |
| 알림 | Expo Push API, SendGrid |
| 배포 설정 | Render Procfile, Expo/Vercel 관련 설정 |

### 주요 Frontend 파일

- `frontend/App.tsx`: 인증 분기 및 내비게이션
- `frontend/src/lib/api.ts`: FastAPI API client
- `frontend/src/lib/supabase.ts`: Supabase Auth client
- `frontend/src/screens/HomeScreen.tsx`: 현재 월 지출·예산 대시보드
- `frontend/src/screens/ExpenseScreen.tsx`: 직접 입력·OCR·파일 가져오기 진입
- `frontend/src/screens/ExpenseFormScreen.tsx`: 지출 생성·수정
- `frontend/src/screens/ExpenseDetailScreen.tsx`: 지출 상세·삭제
- `frontend/src/screens/AnalysisScreen.tsx`: 카테고리·월별 통계와 AI insight
- `frontend/src/screens/GoalScreen.tsx`: 목표 관리와 AI 조언
- `frontend/src/screens/ChatScreen.tsx`: AI 재무 채팅
- `frontend/src/screens/SettingScreen.tsx`: 예산·카테고리·정기 지출·이메일 설정

### 주요 Backend 파일

- `backend/main.py`: FastAPI 앱, router, scheduler lifecycle
- `backend/database.py`: Supabase client
- `backend/scheduler.py`: 정기 지출·이메일 cron
- `backend/graph_rag.py`: Neo4j 구축·검색·동기화
- `backend/routers/expenses.py`: 지출 CRUD·통계·예산 push
- `backend/routers/goals.py`: 목표와 입금
- `backend/routers/categories.py`: 카테고리
- `backend/routers/recurring.py`: 정기 지출 정의
- `backend/routers/budget.py`: 예산
- `backend/routers/chat.py`: AI 채팅·insight·목표 조언
- `backend/routers/ocr.py`: 영수증 OCR
- `backend/routers/excel.py`: Excel/CSV 가져오기
- `backend/routers/profiles.py`: push token·이메일 설정
- `backend/routers/email_alert.py`: AI 이메일과 SendGrid
- `backend/routers/auth.py`: 회원 탈퇴
- `backend/routers/admin.py`: Neo4j 재동기화

### 실행·연결 구조

1. `App.tsx`가 Supabase session을 확인한다.
2. Frontend `api.ts`가 session access token을 읽는다.
3. FastAPI 요청에 `Authorization: Bearer ...`를 추가한다.
4. 각 router의 `get_user_id()`가 Supabase Auth로 token을 검증한다.
5. router가 Supabase Python SDK로 테이블을 직접 조작한다.
6. 일부 변경은 Neo4j에 추가 동기화된다.
7. 응답 JSON을 화면 state에 반영한다.

---

## 2. 핵심 기능 분석

| 기능 | Frontend | Backend/API | DB·모델 | 상태 | 주요 개선점 |
|---|---|---|---|---|---|
| 회원가입 | `SignupScreen.tsx` | Supabase Auth | Supabase Auth | 구현 | 가입·이메일 인증 안내 |
| 로그인 | `LoginScreen.tsx`, `App.tsx` | Supabase Auth | Auth session | 구현 | 네트워크 오류 분리 |
| 비밀번호 재설정 | `ForgotPasswordModal.tsx` | Supabase Auth OTP | Auth | 구현 | 플랫폼별 deep link 검증 |
| 회원 탈퇴 | `SettingScreen.tsx` | `DELETE /auth/withdraw` | 주요 테이블·Auth | 부분 구현 | transaction, `goal_deposits` 정리 검증 |
| 지출 조회 | `HomeScreen.tsx` | `GET /expenses/` | `expenses` | 구현 | 전체 조회 후 현재 월만 filter |
| 지출 생성 | `ExpenseFormScreen.tsx` | `POST /expenses/` | `expenses`, `ExpenseCreate` | 구현 | 금액 검증·중복 제출 방지 |
| 지출 수정 | 폼·상세 화면 | `PUT /expenses/{id}` | `expenses` | 구현 | 정기 지출 원본과 불일치 가능 |
| 지출 삭제 | 상세 화면 | `DELETE /expenses/{id}` | `expenses` | 구현 | 복구·휴지통 없음 |
| 수입 | 없음 | 없음 | 없음 | 미구현 | 수입·잔액 모델 필요 |
| 검색 | 없음 | 없음 | 없음 | 미구현 | 제목·메모·기간 검색 필요 |
| 카테고리 filter | `HomeScreen.tsx` | Frontend filter | `expenses.category` | 구현 | 서버 filter 없음 |
| 정렬 | `HomeScreen.tsx` | Frontend sort | 없음 | 구현 | pagination과 서버 정렬 |
| 카테고리 | `SettingScreen.tsx` | `GET/POST/DELETE /categories` | `categories` | 부분 구현 | 수정 API 없음 |
| 예산 | 홈·설정 | `GET/POST /budget/` | `budgets` | 구현 | 월별 이력 없음 |
| 예산 진행률 | `HomeScreen.tsx` | Frontend 계산 | `expenses`, `budgets` | 구현 | 선택 월 지원 없음 |
| 예산 초과 push | 로그인·지출 생성 | `POST /expenses/` 내부 | `profiles.push_token` | 부분 구현 | 중복 알림·이력·retry 없음 |
| 카테고리 통계 | `AnalysisScreen.tsx` | `GET /expenses/analysis/category` | `expenses` | 구현 | 현재 월만 계산 |
| 월별 추이 | `AnalysisScreen.tsx` | `GET /expenses/analysis/monthly` | `expenses` | 구현 | 거래가 있는 최근 6개 월만 |
| 목표 | `GoalScreen.tsx` | `/goals/*` | `goals` | 구현 | transaction·검증 강화 |
| 목표 입금 | `GoalDepositModal.tsx` | `/goals/{id}/deposits` | `goal_deposits` | 구현 | 입금과 합계 갱신 비원자적 |
| 정기 지출 | 설정 화면 | `/recurring/*`, scheduler | `recurring_expenses`, `expenses` | 부분 구현 | RLS·중복·월말 처리 |
| AI 채팅 | `ChatScreen.tsx` | `POST /chat/` | Neo4j, `budgets` | 구현 | graph 정합성 의존 |
| AI insight | 분석 화면 | `GET /chat/insight` | Supabase·Neo4j | 구현 | 매번 생성, 저장·cache 없음 |
| 목표 AI 조언 | 목표 화면 | `GET /chat/goal-advice/{id}` | `goals`, Neo4j | 구현 | 결과 저장 없음 |
| 영수증 OCR | 입력 화면 | `POST /ocr/` | 저장 안 함 | 구현 | 크기 제한·결과 검증 |
| Excel/CSV import | 입력 화면 | `POST /excel/upload` | `expenses` | 부분 구현 | 첫 20행, 중복 방지·Neo4j sync 없음 |
| 이메일 조언 | 설정 toggle | scheduler→Groq→SendGrid | `profiles`, `expenses` | 부분 구현 | 실행 이력·retry 없음 |
| 데이터 export | 없음 | 없음 | 없음 | 미구현 | 실제 서비스라면 필요 |

---

## 3. 데이터 흐름 분석

### 사용자가 지출을 등록할 때

```text
사용자 입력
→ ExpenseFormScreen.handleSave()
→ api.ts:createExpense()
→ POST /expenses/
→ expenses.py:create_expense()
   ├─ get_user_id()
   │   └─ Supabase Auth token 검증
   ├─ get_supabase_with_token()
   ├─ expenses INSERT
   ├─ graph_rag.sync_expense()
   │   └─ Neo4j Expense/Category/DateNode MERGE
   └─ 예산 초과 확인
       ├─ budgets 조회
       ├─ 현재 월 expenses 합계
       ├─ profiles.push_token 조회
       └─ Expo Push API 호출
→ 저장된 expense 반환
→ 성공 알림과 화면 이동
→ HomeScreen useFocusEffect()
→ expenses·budget·categories 재조회
→ 현재 월 목록·합계·예산 진행률 갱신
```

실제 데이터 접근 구조는 다음과 같다.

```text
React Native
→ API client
→ FastAPI Router
→ Supabase SDK
→ PostgreSQL
```

### 데이터별 저장·조회

| 데이터 | 생성 | 저장 | 조회·사용 |
|---|---|---|---|
| 지출 | 직접 입력·정기 생성·OCR 확인·Excel import | `expenses` | 홈·통계·AI·이메일 |
| 수입 | 없음 | 없음 | 없음 |
| 카테고리 | 기본 seed·사용자 추가 | `categories` | 입력·홈·분석·설정 |
| 예산 | 설정 화면 | `budgets` | 홈·push·AI |
| 목표 | 목표 화면 | `goals` | 목표·AI·Neo4j |
| 목표 입금 | 목표 modal | `goal_deposits` | 목표 합계 계산 |
| 정기 지출 | 설정 화면 | `recurring_expenses` | 설정·scheduler |
| 통계 | 요청 시 계산 | 별도 저장 없음 | 분석 화면 |
| 사용자 | 회원가입 | Supabase Auth | 인증·이메일 대상 |
| AI 결과 | Groq 호출 시 생성 | 저장 안 함 | 즉시 화면·이메일 |
| 알림 설정 | 로그인·설정 | `profiles` | Push·이메일 |
| 알림 이력 | 없음 | 없음 | 없음 |
| 그래프 | CRUD 후 sync | Neo4j | AI context |

정기 지출과 Excel import는 일반 `create_expense()`를 거치지 않는다. 정기 지출은 예산 push를 실행하지 않고, Excel import는 Neo4j sync와 예산 push를 모두 실행하지 않는다.

---

## 4. 자동화 후보

| 후보 | 현재 처리 | 반복성 | 필요성 | n8n 적합도 | 수정량 | 난이도 | 포트폴리오 |
|---|---|---:|---:|---:|---:|---:|---:|
| 일일 AI 이메일 | APScheduler→Groq→SendGrid | 매우 높음 | 높음 | 매우 높음 | 낮음~중간 | 중간 | 매우 높음 |
| AI 월간 리포트 | 통계·AI 로직 재사용 가능 | 높음 | 높음 | 매우 높음 | 중간 | 중간 | 매우 높음 |
| 정기 지출 생성 | APScheduler·DB 직접 처리 | 매우 높음 | 매우 높음 | 매우 높음 | 중간 | 중간 | 높음 |
| 예산 초과 알림 | 지출 API 내부 동기 push | 높음 | 매우 높음 | 높음 | 중간 | 중간 | 높음 |
| 목표 마감 알림 | `goals.deadline` 존재 | 높음 | 중간 | 매우 높음 | 낮음~중간 | 낮음~중간 | 높음 |
| 소비 패턴 분석 | 화면 요청 시 Groq 생성 | 중간 | 높음 | 높음 | 중간 | 중간 | 높음 |
| Excel 비동기 import | 요청 중 AI·행별 저장 | 중간 | 높음 | 높음 | 높음 | 높음 | 매우 높음 |
| Neo4j 복구 sync | CRUD best-effort·수동 API | 중간 | 높음 | 높음 | 중간 | 중간 | 매우 높음 |
| 영수증 OCR | 사용자 요청-응답 | 낮음 | 중간 | 중간 | 높음 | 중간 | 중간 |

가장 명확한 자동화 대상은 이미 APScheduler로 구현된 정기 지출과 이메일이다. 외부 API 호출, 분기, 재시도, 실행 이력이 필요한 작업이기 때문이다.

---

## 5. n8n 적용 가능 구조

### 권장 구조

```text
Expo React Native
        ↓
      FastAPI
        ├─ Supabase PostgreSQL
        │      └─ 업무 데이터 원본
        │
        ├─ Automation Event / Outbox
        │      ↓
        │   n8n Webhook
        │      ├─ Groq
        │      ├─ SendGrid
        │      ├─ Expo Push
        │      └─ Caslow Internal API
        │
        └─ Internal Automation API
               ↑
         n8n Schedule Trigger
```

### n8n 호출 시점

Webhook:

- 지출 저장 완료 후
- 예산 변경 완료 후
- 목표 생성·변경 후
- Excel import job 생성 후
- 알림 대상 업무 이벤트 확정 후

Schedule Trigger:

- 정기 지출
- 일일·주간·월간 리포트
- 목표 마감 알림
- Neo4j 재동기화
- 실패 workflow 재처리

Frontend가 n8n을 직접 호출해서는 안 된다.

```text
Frontend → FastAPI → DB commit → n8n Webhook
```

Webhook에는 전체 금융 데이터보다 식별자 위주로 전달하는 것이 안전하다.

```json
{
  "event_id": "uuid",
  "event_type": "expense.created",
  "occurred_at": "ISO-8601",
  "user_id": "uuid",
  "resource_id": "expense-uuid",
  "resource_version": 1
}
```

n8n은 상세 데이터가 필요할 때 인증된 Caslow 내부 API를 호출해야 한다. n8n의 업무 테이블 직접 쓰기는 validation, 사용자 소유권, 중복 방지, Neo4j sync 및 예산 처리를 우회하므로 기본적으로 권장하지 않는다.

FastAPI는 인증, 업무 validation, transaction, idempotency, 데이터 쓰기와 webhook 검증을 담당하고 n8n은 일정, 외부 서비스 orchestration, 분기, retry와 실행 이력을 담당하는 것이 적절하다.

---

## 6. n8n 적용 시 주의점

### 높은 결합도

`create_expense()`는 인증, DB insert, Neo4j sync, 예산 집계와 Push를 모두 처리한다. `send_daily_email_advice()`도 사용자 조회, 집계, AI, HTML과 발송을 모두 처리한다.

### API 구조

- router에 업무 로직 집중
- 공통 인증 코드 중복
- 내부 API 없음
- pagination과 bulk API 없음
- idempotency와 automation 상태 API 없음

### 인증

- 사용자 access token은 n8n 장기 credential에 부적합하다.
- Supabase service role key를 n8n에 직접 제공하면 권한이 과도하다.
- n8n 전용 service JWT 또는 HMAC이 필요하다.
- `/admin/resync-neo4j`는 별도 관리자 권한 검사 없이 로그인만 확인한다.

### 중복 실행

- 다중 Backend 인스턴스에서 APScheduler 중복 실행 가능
- check-then-insert 경쟁 조건
- 동일 날짜·금액·카테고리인 다른 정기 지출 오인 가능
- 예산 초과 이후 매 입력마다 push 가능
- Excel 재업로드 중복 방지 없음

### 트랜잭션

- 목표 입금 추가·삭제와 합계 갱신
- 회원 데이터 삭제와 Auth 삭제
- Excel 다건 insert
- Supabase 저장과 Neo4j sync
- 정기 지출과 Neo4j sync

위 작업들은 하나의 transaction으로 보장되지 않는다.

### 에러 처리와 보안

- Neo4j와 Push 실패는 주로 로그만 기록한다.
- 알림 발송 이력과 dead-letter queue가 없다.
- CORS가 전체 origin을 허용한다.
- Frontend API URL이 하드코딩되어 있다.
- OCR·Excel 크기 제한이 부족하다.
- 사용자 금융 데이터가 Groq에 전달된다.
- webhook replay 방지와 민감 payload 최소화가 필요하다.

### Neo4j 사용자 격리

- `Expense`, `Goal`, `Recurring`에는 일부 sync에서 `user_id`가 저장된다.
- `Category`, `DateNode`, `Pattern`은 사용자 간 공유될 수 있다.
- `build_graph()`에 전체 그래프 삭제 로직이 있다.
- 글로벌 null node 삭제 로직이 존재한다.

자동 sync 전에 tenant 단위 식별자와 constraint가 필요하다.

---

## 7. n8n 적용 전 리팩토링

### 자동화 이벤트와 idempotency

[현재 문제] 고유 event ID와 처리 상태가 없다.

[왜 문제인지] Webhook 재시도 시 중복 지출, 이메일, Push가 발생할 수 있다.

[추천 수정 방법] `automation_events` 또는 outbox 구조를 추가하고 DB 변경과 동일 transaction에서 기록한다.

[수정 우선순위] P0

### n8n 전용 인증

[현재 문제] n8n용 service-to-service 인증이 없다.

[왜 문제인지] 사용자 token은 만료되고 service key는 과도한 권한을 가진다.

[추천 수정 방법] `/internal/automation/*`와 HMAC 또는 짧은 수명의 service JWT를 추가한다.

[수정 우선순위] P0

### 정기 지출 occurrence key

[현재 문제] 날짜·금액·카테고리로 중복을 판단한다.

[왜 문제인지] 서로 다른 항목을 중복으로 판단하거나 동시 실행으로 두 번 생성할 수 있다.

[추천 수정 방법] `recurring_expense_id`, `occurrence_month`, 복합 unique constraint와 idempotent 생성 API를 추가한다.

[수정 우선순위] P0

### 알림 이력

[현재 문제] 발송 여부와 실패 이유를 저장하지 않는다.

[왜 문제인지] 중복, 누락, 재시도를 관리할 수 없다.

[추천 수정 방법] `notification_deliveries` 또는 같은 목적의 상태 저장 구조를 추가한다.

[수정 우선순위] P0

### 최소 Service 분리

[현재 문제] router와 scheduler가 업무 로직을 직접 수행한다.

[왜 문제인지] 일반 API와 내부 자동화 API가 같은 로직을 재사용하기 어렵다.

[추천 수정 방법] `ExpenseService`, `RecurringExpenseService`, `NotificationService`, `ReportService`, `GraphSyncService` 정도만 우선 분리한다.

[수정 우선순위] P1

### Neo4j tenant 격리

[현재 문제] 공유 node와 글로벌 삭제 로직이 있다.

[왜 문제인지] 사용자 간 데이터가 섞이거나 자동 복구가 다른 사용자에게 영향을 줄 수 있다.

[추천 수정 방법] 사용자 소유 node에 `user_id`, 복합 식별자와 constraint를 추가하고 전체 삭제를 제거한다.

[수정 우선순위] P0

### Excel import job

[현재 문제] 하나의 HTTP 요청에서 AI와 다건 insert를 수행한다.

[왜 문제인지] timeout, 중복, 부분 실패 복구가 어렵다.

[추천 수정 방법] import job, preview, 승인과 bulk commit 구조로 변경한다.

[수정 우선순위] P1

---

## 8. 추천 n8n 기능 TOP 3

### 1위: AI 소비 리포트와 멀티채널 알림

1. 기능: 일일·주간·월간 지출 요약, 예산 상태와 AI 조언을 이메일·Push로 발송한다.
2. 선정 이유: APScheduler, Groq, SendGrid, Expo Push가 이미 존재하며 외부 호출, retry와 분기 관리가 필요하다.
3. 재사용: `send_daily_email_advice()`, 통계 API, `/chat/insight`, `profiles`, `budgets`.
4. 신규 개발: 내부 요약 API, 사용자 발송 설정, 알림 이력, idempotency, service 인증.
5. Workflow: Schedule → 대상 사용자 → 지출·예산 요약 → Groq → 채널 분기 → 발송 → 결과 기록 → retry.
6. 난이도: 중간.
7. 포트폴리오 가치: AI 개인화, 멀티채널, retry와 실행 이력을 함께 보여줄 수 있다.

### 2위: 정기 지출 자동 생성

1. 기능: 매일 실행해 해당 날짜의 정기 지출을 idempotent하게 생성한다.
2. 선정 이유: 현재 APScheduler의 프로세스 의존, 중복과 RLS 문제를 개선할 수 있다.
3. 재사용: `recurring_expenses`, `process_recurring_expenses()`, 지출 생성, Neo4j sync.
4. 신규 개발: due 조회 API, occurrence API, unique key, 월말 정책, 실행 이력.
5. Workflow: Daily Schedule → due 목록 → occurrence 생성 → graph sync → 결과 기록 → 실패 재시도.
6. 난이도: 중간.
7. 포트폴리오 가치: idempotency와 안정적인 정기 실행 설계를 강조할 수 있다.

### 3위: Excel/CSV 비동기 AI import

1. 기능: 파일을 비동기로 분석하고 preview·승인 후 bulk 저장한다.
2. 선정 이유: 현재 첫 20행 분석, 즉시 저장, 부분 성공과 sync 누락 문제가 있다.
3. 재사용: Pandas 파싱, Groq prompt, 카테고리, 지출 모델, Neo4j sync.
4. 신규 개발: import job/row, 파일 저장, preview UI, 중복 hash, bulk commit.
5. Workflow: 업로드 → import job → n8n → 파싱·AI 분류 → 검증·중복 검사 → preview → 승인 → bulk 저장 → graph sync → 알림.
6. 난이도: 높음.
7. 포트폴리오 가치: Human-in-the-loop AI와 비동기 데이터 pipeline을 보여줄 수 있다.

---

## 9. 최종 기술 분석 요약

### Caslow 현재 상태

- 전체 아키텍처: Expo React Native → FastAPI → Supabase PostgreSQL, Neo4j 보조 그래프와 Groq·SendGrid·Expo Push 연동
- Backend: FastAPI router가 인증·업무·DB·AI·알림을 직접 처리
- Frontend: Expo/React Native 기반 모바일·웹 앱, Supabase Auth 직접 사용
- Database: Supabase가 원본 DB, Neo4j가 AI context용 파생 저장소
- AI: Groq LLaMA 3.3 채팅·분석·파일 처리, LLaMA 4 Scout OCR
- 주요 기능: 인증, 지출 CRUD, 카테고리, 예산, 통계, 목표, 정기 지출, AI, OCR, Excel import, Push·이메일
- 현재 완성도: 기능 범위는 넓지만 자동화 정합성, 중복 방지, transaction과 운영 이력은 프로토타입 수준

### n8n 적용 가능성

- 적용 적합도: 높음
- 가장 적합한 영역: 스케줄, AI 리포트, 이메일·Push, 정기 지출, 비동기 파일 처리
- 기존 코드 수정량: 알림은 낮음~중간, 정기 지출은 중간, Excel은 중간~높음
- 예상 난이도: 중간 이상

### 추천

1. AI 소비 리포트 및 멀티채널 알림
2. 신뢰성 있는 정기 지출 자동 생성
3. Excel/CSV 비동기 AI import

### n8n 적용 전 선행 작업

1. 내부 automation API와 service 인증
2. event/outbox, idempotency와 실행 이력
3. 정기 지출 unique occurrence와 Neo4j 사용자 격리

## 결론

현재 Caslow에 n8n을 바로 적용하는 것은 권장하지 않는다.

n8n 자체는 Caslow에 적합하지만 현재 구조에서 webhook을 바로 추가하거나 n8n이 Supabase를 직접 수정하면 중복 정기 지출, 중복 알림, 인증 우회, Supabase와 Neo4j 불일치, 실패 workflow 재처리 불가와 FastAPI/n8n 간 업무 규칙 중복 문제가 확대될 수 있다.

전면 개편은 필요하지 않다. 먼저 내부 API, service 인증, idempotency, 알림·실행 이력, 정기 지출 unique key와 Neo4j 사용자 격리를 보강한 뒤 AI 소비 리포트·알림부터 적용하는 것이 적절하다.
