# FastAPI 메인 파일
# 모든 라우터를 여기서 연결해요

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routers import expenses,goals,categories,recurring,budget,chat
from scheduler import start_scheduler

# 앱 시작/종료 시 실행되는 함수
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 서버 시작할 때 스케줄러 시작
    start_scheduler()
    yield
    # 서버 종료할 때 스케줄러 종료

app = FastAPI(lifespan=lifespan)

# CORS 설정
# 프론트엔드에서 백엔드 API 호출할 수 있게 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 중 전체 허용
    allow_credentials=False,  # True → False
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(expenses.router)
app.include_router(goals.router)
app.include_router(categories.router)
app.include_router(recurring.router)
app.include_router(budget.router)
app.include_router(chat.router)
# 서버 상태 확인용 API
@app.get("/")
def root():
    return {"message": "Caslow API is running!"}