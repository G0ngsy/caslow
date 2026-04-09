# 목표 CRUD API 라우터

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from database import supabase, get_supabase_with_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/goals", tags=["goals"])

# 목표 생성 데이터 타입
class GoalCreate(BaseModel):
    title: str
    target_amount: int
    type: str
    deadline: Optional[str] = None

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ 목표 목록 조회 (GET /goals)
@router.get("/")
def get_goals(authorization: str = Header(...)):
    """로그인한 사용자의 목표 목록 반환"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("goals") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    return response.data

# ✅ 목표 추가 (POST /goals)
@router.post("/")
def create_goal(goal: GoalCreate, authorization: str = Header(...)):
    """새로운 목표 추가"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    data = {
        "user_id": user_id,
        "title": goal.title,
        "target_amount": goal.target_amount,
        "type": goal.type,
        "deadline": goal.deadline,
        "current_amount": 0,
    }

    response = authed_supabase.table("goals").insert(data).execute()
    return response.data[0]

# ✅ 목표 삭제 (DELETE /goals/{id})
@router.delete("/{goal_id}")
def delete_goal(goal_id: str, authorization: str = Header(...)):
    """목표 삭제"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("goals") \
        .delete() \
        .eq("id", goal_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다.")

    return {"message": "삭제되었습니다."}


# 목표 수정 데이터 타입
class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[int] = None
    current_amount: Optional[int] = None
    type: Optional[str] = None
    deadline: Optional[str] = None

# ✅ 목표 수정 (PUT /goals/{id})
@router.put("/{goal_id}")
def update_goal(goal_id: str, goal: GoalUpdate, authorization: str = Header(...)):
    """목표 수정"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # None이 아닌 값만 업데이트
    data = {k: v for k, v in goal.dict().items() if v is not None}

    response = authed_supabase.table("goals") \
        .update(data) \
        .eq("id", goal_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다.")

    return response.data[0]


