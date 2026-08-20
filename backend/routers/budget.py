# 월 예산 CRUD API 라우터

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import supabase, get_supabase_with_token
from graph_rag import graph_rag  # Neo4j 연동 추가
from datetime import date
from typing import Optional
from date_utils import validate_year_month

router = APIRouter(prefix="/budget", tags=["budget"])

class BudgetUpdate(BaseModel):
    amount: int
    year: Optional[int] = None
    month: Optional[int] = None

def validate_period(year: int, month: int) -> None:
    try:
        validate_year_month(year, month)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ 예산 조회 (GET /budget)
@router.get("/")
def get_budget(
    authorization: str = Header(...),
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    """로그인한 사용자의 월 예산 반환"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    if (year is None) != (month is None):
        raise HTTPException(status_code=422, detail="year와 month는 함께 입력해야 합니다.")
    today = date.today()
    target_year = year if year is not None else today.year
    target_month = month if month is not None else today.month
    validate_period(target_year, target_month)

    response = authed_supabase.table("budgets") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("year", target_year) \
        .eq("month", target_month) \
        .execute()

    # 월별 예산이 없으면 미설정 상태로 반환
    if not response.data:
        return {"amount": 0, "is_set": False, "year": target_year, "month": target_month}

    return {"amount": response.data[0]["amount"], "is_set": True, "year": target_year, "month": target_month}

# ✅ 예산 저장/수정 (POST /budget)
@router.post("/")
def save_budget(budget: BudgetUpdate, authorization: str = Header(...)):
    """월 예산 저장 (없으면 생성, 있으면 수정)"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    if (budget.year is None) != (budget.month is None):
        raise HTTPException(status_code=422, detail="year와 month는 함께 입력해야 합니다.")
    today = date.today()
    target_year = budget.year if budget.year is not None else today.year
    target_month = budget.month if budget.month is not None else today.month
    validate_period(target_year, target_month)
    if budget.amount < 0:
        raise HTTPException(status_code=422, detail="예산은 0원 이상이어야 합니다.")

    # 해당 월의 기존 예산 확인
    existing = authed_supabase.table("budgets") \
        .select("id") \
        .eq("user_id", user_id) \
        .eq("year", target_year) \
        .eq("month", target_month) \
        .execute()

    if existing.data:
        # 있으면 수정
        authed_supabase.table("budgets") \
            .update({"amount": budget.amount}) \
            .eq("user_id", user_id) \
            .eq("year", target_year) \
            .eq("month", target_month) \
            .execute()
    else:
        # 없으면 생성
        authed_supabase.table("budgets") \
            .insert({
                "user_id": user_id,
                "amount": budget.amount,
                "year": target_year,
                "month": target_month,
            }) \
            .execute()

    # Neo4j는 현재 월 AI 검색용 projection만 유지한다.
    try:
        if graph_rag and (target_year, target_month) == (today.year, today.month):
            graph_rag.sync_budget(user_id, budget.amount, target_year, target_month)
    except Exception as e:
        print(f"⚠️ Neo4j 동기화 실패 (예산): {e}")

    return {"amount": budget.amount, "is_set": True, "year": target_year, "month": target_month}
