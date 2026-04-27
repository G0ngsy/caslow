# 💰 Caslow (Cash + Flow)

> GraphRAG 기반 대화형 개인 재무 관리 앱

자연어 대화만으로 소비 패턴을 분석하고 재무 목표를 관리해주는 AI 가계부 앱입니다.

🌐 **웹 데모**: [caslow.vercel.app](https://caslow.vercel.app)

---

## ✨ 주요 기능 (Core Features)

### AI 채팅
- Neo4j GraphRAG 기반으로 사용자 지출 데이터를 탐색
- Groq LLaMA 3.3 70B 모델로 개인화된 재무 조언 제공
- "이번 달 가장 많이 쓴 카테고리가 뭐야?" 같은 자연어 질의 가능

### 지출 입력
- 직접 입력, 영수증 촬영(Groq Vision OCR), 엑셀/CSV 가져오기
- AI가 지출 항목명을 보고 카테고리 자동 분류
- 정기 지출(월세, 구독료 등) 자동 등록 (APScheduler)

### 분석
- 카테고리별 도넛 차트 (전체 / 변동 / 정기 탭)
- 월별 지출 추이 라인 차트
- AI 인사이트 카드 (예산 초과 여부 포함)

### 목표 관리
- 재무 목표 금액 및 기간 설정
- 달성률 시각화 + GraphRAG 기반 AI 조언

### 예산 관리
- 월 예산 설정
- 초과 시 홈 화면 경고 배너 + 푸시 알림 전송

### 이메일 알림
- 매일 아침 10시 AI 소비 조언 이메일 자동 발송 (SendGrid)
- 설정 화면에서 수신 여부 토글 가능

### 인증
- 이메일 회원가입 / 로그인 (Supabase Auth)
- 비밀번호 재설정: 이메일 OTP 인증 모달
- 회원탈퇴: 모든 데이터 삭제 후 계정 제거

---

## 🛠 기술 스택 (Tech Stack)

**Frontend**

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![React Navigation](https://img.shields.io/badge/React_Navigation-7B11F1?style=for-the-badge&logo=react-navigation&logoColor=white)

**Backend & AI**

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_API-F55036?style=for-the-badge&logo=groq&logoColor=white)
![Neo4j](https://img.shields.io/badge/Neo4j_Aura-4581C3?style=for-the-badge&logo=neo4j&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white)

**Infrastructure**

![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Android Studio](https://img.shields.io/badge/Android_Studio-3DDC84?style=for-the-badge&logo=android-studio&logoColor=white)
![UptimeRobot](https://img.shields.io/badge/UptimeRobot-3BD671?style=for-the-badge&logo=uptimerobot&logoColor=white)

**세부 기술 리스트**

| 구분 | 기술 / 라이브러리 |
|------|----------------|
| Frontend | React Native, TypeScript, Expo, React Navigation |
| UI | react-native-gifted-charts, expo-image-picker |
| 푸시 알림 | expo-notifications, Expo Push API |
| Backend | Python, FastAPI, Uvicorn |
| LLM / AI | Groq API — LLaMA 3.3 70B, llama-4-scout (Vision OCR) |
| GraphRAG | Neo4j Aura, neo4j (Python driver) |
| DB / Auth | Supabase (PostgreSQL), supabase-py |
| 이메일 | SendGrid SMTP, sendgrid (Python) |
| 스케줄러 | APScheduler, pandas (CSV 파싱) |
| 배포 | Render (백엔드), Vercel (웹), Android Studio APK |
| 모니터링 | UptimeRobot (Render 슬리프 방지 헬스체크) |

---

## ⚙️ 핵심 데이터 처리 로직 (Data Processing Pipeline)

지출 데이터를 수집하고 GraphRAG 기반 AI 응답을 생성하기까지의 처리 흐름입니다.

| 단계 | 도구 | 역할 및 결과물 |
|------|------|--------------|
| 지출 입력 | 직접입력 / Groq Vision / pandas | 지출 데이터 수집 및 정제 |
| 카테고리 분류 | Groq LLaMA | 항목명 분석 → 카테고리 자동 태깅 |
| 그래프 구성 | Neo4j (Cypher) | 지출-카테고리-날짜-패턴 노드/엣지 생성 |
| 컨텍스트 탐색 | Neo4j GraphRAG | 질의와 관련된 노드 탐색 → 컨텍스트 추출 |
| AI 응답 생성 | Groq LLaMA 3.3 70B | 컨텍스트 + 예산 정보 → 개인화 조언 |
| 알림 발송 | SendGrid / Expo Push API | 예산 초과 / 일일 소비 조언 전송 |

---

## 🏗 아키텍처 (Architecture)

![아키텍처](frontend/assets/가계부%20시스템%20아키텍처.png)

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


