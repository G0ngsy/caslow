# 카테고리 CRUD API 라우터

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from database import supabase, get_supabase_with_token

router = APIRouter(prefix="/categories", tags=["categories"])

# 카테고리 생성 데이터 타입
class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = '#255DAA'

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

DEFAULT_CATEGORIES = [
    {"name": "카페",  "color": "#A78BFA"},
    {"name": "음식",  "color": "#F59E0B"},
    {"name": "교통",  "color": "#3B82F6"},
    {"name": "쇼핑",  "color": "#EC4899"},
    {"name": "구독",  "color": "#10B981"},
    {"name": "기타",  "color": "#6B7280"},
]

# ✅ 카테고리 목록 조회 (GET /categories)
@router.get("/")
def get_categories(authorization: str = Header(...)):
    """로그인한 사용자의 카테고리 목록 반환. 없으면 기본 카테고리 자동 생성."""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("categories") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        rows = [{"user_id": user_id, **cat} for cat in DEFAULT_CATEGORIES]
        authed_supabase.table("categories").insert(rows).execute()
        seeded = authed_supabase.table("categories") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()
        return seeded.data

    return response.data

# ✅ 카테고리 추가 (POST /categories)
@router.post("/")
def create_category(category: CategoryCreate, authorization: str = Header(...)):
    """새로운 카테고리 추가"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    data = {
        "user_id": user_id,
        "name": category.name,
        "color": category.color,
    }

    response = authed_supabase.table("categories").insert(data).execute()
    return response.data[0]

# ✅ 카테고리 삭제 (DELETE /categories/{id})
@router.delete("/{category_id}")
def delete_category(category_id: str, authorization: str = Header(...)):
    """카테고리 삭제"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("categories") \
        .delete() \
        .eq("id", category_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="카테고리를 찾을 수 없습니다.")

    return {"message": "삭제되었습니다."}