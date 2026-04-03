# FastAPI 메인 파일
# 모든 라우터를 여기서 연결해요

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import expenses

app = FastAPI()

# CORS 설정
# 프론트엔드에서 백엔드 API 호출할 수 있게 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
# /expenses 경로로 시작하는 API들을 expenses 라우터에 연결
app.include_router(expenses.router)

# 서버 상태 확인용 API
@app.get("/")
def root():
    return {"message": "Caslow API is running!"}