# 인증 관련 라우터
# 회원탈퇴 시 모든 데이터 삭제

from fastapi import APIRouter, Header, HTTPException
from database import supabase, get_supabase_with_token
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ 회원탈퇴 (DELETE /auth/withdraw)
@router.delete("/withdraw")
def withdraw(authorization: str = Header(...)):
    """회원탈퇴 - 모든 데이터 삭제"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 모든 관련 데이터 삭제
    authed_supabase.table("expenses").delete().eq("user_id", user_id).execute()
    authed_supabase.table("goals").delete().eq("user_id", user_id).execute()
    authed_supabase.table("categories").delete().eq("user_id", user_id).execute()
    authed_supabase.table("recurring_expenses").delete().eq("user_id", user_id).execute()
    authed_supabase.table("budgets").delete().eq("user_id", user_id).execute()
    authed_supabase.table("profiles").delete().eq("user_id", user_id).execute()

    # Supabase Auth에서 유저 삭제 (서비스 키 필요)
    supabase.auth.admin.delete_user(user_id)

    return {"success": True, "message": "회원탈퇴가 완료되었습니다."}