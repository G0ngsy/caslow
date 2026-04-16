# 프로필 라우터
# 푸시 토큰 저장 및 관리

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from database import supabase, get_supabase_with_token
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/profiles", tags=["profiles"])

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

class PushTokenRequest(BaseModel):
    push_token: str  # 푸시 토큰

# ✅ 푸시 토큰 저장 (POST /profiles/push-token)
@router.post("/push-token")
def save_push_token(request: PushTokenRequest, authorization: str = Header(...)):
    """유저 푸시 토큰 저장"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 기존 프로필 확인
    existing = authed_supabase.table("profiles") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    if existing.data:
        # 기존 프로필 업데이트
        authed_supabase.table("profiles") \
            .update({"push_token": request.push_token}) \
            .eq("user_id", user_id) \
            .execute()
    else:
        # 새 프로필 생성
        authed_supabase.table("profiles") \
            .insert({
                "user_id": user_id,
                "push_token": request.push_token
            }) \
            .execute()

    return {"success": True, "message": "푸시 토큰 저장 완료"}