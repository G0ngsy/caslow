# 지출 데이터 타입 정의 파일
# FastAPI에서 요청/응답 데이터 형식을 정의해요
# Pydantic 모델을 사용해서 자동으로 유효성 검사를 해줘요

from pydantic import BaseModel
from typing import Optional
from datetime import date

# 지출 생성할 때 받는 데이터 형식
class ExpenseCreate(BaseModel):
    title: str           # 지출 이름 (필수)
    amount: int          # 금액
    category: str        # 카테고리
    memo: Optional[str] = None  # 메모 (선택사항)
    date: date           # 날짜

# 지출 수정할 때 받는 데이터 형식
class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[int] = None
    category: Optional[str] = None
    memo: Optional[str] = None
    date: Optional[date] = None

# 지출 조회할 때 반환하는 데이터 형식
class ExpenseResponse(BaseModel):
    id: str              # 고유 ID
    user_id: str         # 사용자 ID
    amount: int          # 금액
    category: str        # 카테고리
    memo: Optional[str] = None  # 메모
    date: date           # 날짜
    created_at: str      # 생성일시