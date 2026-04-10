# 월 예산 CRUD API 라우터

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import supabase, get_supabase_with_token

router = APIRouter(prefix="/budget", tags=["budget"])

class BudgetUpdate(BaseModel):
    amount: int

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ 예산 조회 (GET /budget)
@router.get("/")
def get_budget(authorization: str = Header(...)):
    """로그인한 사용자의 월 예산 반환"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("budgets") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    # 예산이 없으면 기본값 500000 반환
    if not response.data:
        return {"amount": 500000}

    return {"amount": response.data[0]["amount"]}

# ✅ 예산 저장/수정 (POST /budget)
@router.post("/")
def save_budget(budget: BudgetUpdate, authorization: str = Header(...)):
    """월 예산 저장 (없으면 생성, 있으면 수정)"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 기존 예산 확인
    existing = authed_supabase.table("budgets") \
        .select("id") \
        .eq("user_id", user_id) \
        .execute()

    if existing.data:
        # 있으면 수정
        response = authed_supabase.table("budgets") \
            .update({"amount": budget.amount}) \
            .eq("user_id", user_id) \
            .execute()
    else:
        # 없으면 생성
        response = authed_supabase.table("budgets") \
            .insert({"user_id": user_id, "amount": budget.amount}) \
            .execute()

    return {"amount": budget.amount}