# 💰 Caslow (Cash + Flow)

> GraphRAG 기반 대화형 개인 재무 관리 앱

자연어 대화만으로 소비 패턴을 분석하고 재무 목표를 관리해주는 AI 가계부 앱입니다.

🌐 **웹 데모**: [caslow.vercel.app](https://caslow.vercel.app)

---

## ✨ 주요 기능

### 💬 AI 채팅
- Neo4j GraphRAG 기반으로 사용자 지출 데이터를 탐색
- Groq LLaMA 3.3 70B 모델로 개인화된 재무 조언 제공
- "이번 달 가장 많이 쓴 카테고리가 뭐야?" 같은 자연어 질의 가능

### 🧾 지출 입력
- 직접 입력, 영수증 촬영(Groq Vision OCR), 엑셀/CSV 가져오기
- AI가 지출 항목명을 보고 카테고리 자동 분류
- 정기 지출(월세, 구독료 등) 자동 등록 (APScheduler)

### 📊 분석
- 카테고리별 도넛 차트 (전체 / 변동 / 정기 탭)
- 월별 지출 추이 라인 차트
- AI 인사이트 카드 (예산 초과 여부 포함)

### 🎯 목표 관리
- 재무 목표 금액 및 기간 설정
- 달성률 시각화 + GraphRAG 기반 AI 조언

### ⚠️ 예산 관리
- 월 예산 설정
- 초과 시 홈 화면 경고 배너 + 푸시 알림 전송

### 📧 이메일 알림
- 매일 아침 8시 AI 소비 조언 이메일 자동 발송 (SendGrid)

### 🔐 인증
- 이메일 회원가입 / 로그인 (Supabase Auth)
- 비밀번호 재설정: 이메일 OTP 인증 모달
- 회원탈퇴: 모든 데이터 삭제 후 계정 제거

---

## 🛠 기술 스택

| 구분 | 기술 |
|------|------|
| 앱 (프론트) | React Native + TypeScript (Expo) |
| 백엔드 | FastAPI (Python) |
| LLM | Groq API — LLaMA 3.3 70B |
| Vision AI (OCR) | Groq Vision — llama-4-scout |
| GraphRAG | Neo4j Aura |
| DB | Supabase (PostgreSQL) |
| 이메일 | SendGrid SMTP |
| 푸시 알림 | Expo Push API |
| 스케줄러 | APScheduler |
| 배포 (백엔드) | Render |
| 배포 (웹) | Vercel |
| 배포 (앱) | Android Studio 로컬 빌드 (APK) |

---

## 🏗 아키텍처

```
[React Native 앱]
       │
       ▼
[FastAPI 백엔드 — Render]
   ├── Supabase (PostgreSQL) — 지출/목표/예산 데이터
   ├── Neo4j Aura — GraphRAG 지식 그래프
   ├── Groq API — LLM 채팅 / Vision OCR
   ├── SendGrid — 이메일 알림
   └── Expo Push API — 푸시 알림
```

---

## 📁 폴더 구조

```
caslow/
├── frontend/                  # React Native (Expo)
│   └── src/
│       ├── screens/           # 화면 컴포넌트
│       │   └── modals/        # 모달 컴포넌트
│       ├── components/        # 공통 컴포넌트
│       ├── constants/         # 색상, 카테고리 설정
│       └── lib/               # API 호출, Supabase 클라이언트
│
└── backend/                   # FastAPI
    ├── routers/               # API 라우터
    │   ├── expenses.py        # 지출 CRUD
    │   ├── chat.py            # AI 채팅 / 인사이트
    │   ├── ocr.py             # 영수증 OCR
    │   ├── excel.py           # 엑셀/CSV 가져오기
    │   ├── goals.py           # 재무 목표
    │   ├── budget.py          # 월 예산
    │   ├── categories.py      # 카테고리 관리
    │   ├── recurring.py       # 정기 지출
    │   ├── auth.py            # 회원탈퇴
    │   └── email_alert.py     # 이메일 알림
    ├── graph_rag.py           # Neo4j GraphRAG 엔진
    ├── scheduler.py           # APScheduler 설정
    ├── database.py            # Supabase 클라이언트
    └── main.py                # FastAPI 앱 진입점
```

---

## ⚙️ 실행 방법

### 백엔드

```bash
cd backend
pip install -r requirements.txt
```

`.env` 파일 생성:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
GROQ_API_KEY=
NEO4J_URI=
NEO4J_USERNAME=
NEO4J_PASSWORD=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
```

```bash
uvicorn main:app --reload
```

### 프론트엔드

```bash
cd frontend
npm install
```

`.env` 파일 생성:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_API_URL=
```

```bash
npx expo start
```

---

## 📌 포트폴리오 어필 포인트

- Neo4j 기반 GraphRAG 지식 그래프 설계 및 구현
- LLM + Vision AI 멀티모달 파이프라인 구축
- Supabase Auth + OTP 비밀번호 재설정 보안 구현
- 예산 초과 시 Expo 푸시 알림 실시간 전송
- SendGrid SMTP 이메일 자동화
- 완전 무료 클라우드 스택 풀스택 배포
