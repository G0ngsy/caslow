# 목표 CRUD API 라우터

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from database import supabase, get_supabase_with_token
from graph_rag import graph_rag  # Neo4j 싱글톤 인스턴스

router = APIRouter(prefix="/goals", tags=["goals"])

# 목표 생성 데이터 타입
class GoalCreate(BaseModel):
    title: str
    target_amount: int
    type: str
    deadline: Optional[str] = None

# 목표 수정 데이터 타입
class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[int] = None
    current_amount: Optional[int] = None
    type: Optional[str] = None
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
    """새로운 목표 추가 후 Neo4j에도 동기화"""
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
    saved = response.data[0]

    # Neo4j에 목표 노드 동기화
    if graph_rag:
        try:
            graph_rag.sync_goal(saved)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (목표 생성): {e}")

    return saved

# ✅ 목표 수정 (PUT /goals/{id})
@router.put("/{goal_id}")
def update_goal(goal_id: str, goal: GoalUpdate, authorization: str = Header(...)):
    """목표 수정 후 Neo4j에도 동기화"""
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

    updated = response.data[0]

    # Neo4j에 수정된 목표 노드 동기화
    if graph_rag:
        try:
            graph_rag.sync_goal(updated)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (목표 수정): {e}")

    return updated

# ✅ 목표 삭제 (DELETE /goals/{id})
@router.delete("/{goal_id}")
def delete_goal(goal_id: str, authorization: str = Header(...)):
    """목표 삭제 후 Neo4j에서도 제거"""
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

    # Neo4j에서도 목표 노드 삭제
    if graph_rag:
        try:
            graph_rag.delete_goal(goal_id)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (목표 삭제): {e}")

    return {"message": "삭제되었습니다."}


# ── 저축 입금 내역 ──────────────────────────────────────────

# 입금 내역 생성 데이터 타입
class DepositCreate(BaseModel):
    amount: int        # 입금 금액
    note: Optional[str] = None  # 메모 (선택)
    date: Optional[str] = None  # 날짜 (없으면 오늘)

# ✅ 입금 내역 조회 (GET /goals/{id}/deposits)
# 해당 목표의 날짜 역순 입금 내역 반환
@router.get("/{goal_id}/deposits")
def get_deposits(goal_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 내 목표인지 확인
    goal_check = authed_supabase.table("goals").select("id").eq("id", goal_id).eq("user_id", user_id).execute()
    if not goal_check.data:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다.")

    response = authed_supabase.table("goal_deposits") \
        .select("*") \
        .eq("goal_id", goal_id) \
        .order("date", desc=True) \
        .execute()

    return response.data

# ✅ 입금 추가 (POST /goals/{id}/deposits)
# 입금 내역 저장 후 목표의 current_amount 자동 합산
@router.post("/{goal_id}/deposits")
def add_deposit(goal_id: str, deposit: DepositCreate, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 내 목표인지 확인
    goal_res = authed_supabase.table("goals").select("*").eq("id", goal_id).eq("user_id", user_id).execute()
    if not goal_res.data:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다.")
    goal = goal_res.data[0]

    # 입금 내역 저장
    deposit_data = {
        "goal_id": goal_id,
        "user_id": user_id,
        "amount": deposit.amount,
        "note": deposit.note or "",
        "date": deposit.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    authed_supabase.table("goal_deposits").insert(deposit_data).execute()

    # 목표의 current_amount = 전체 입금 내역 합산으로 자동 갱신
    all_deposits = authed_supabase.table("goal_deposits").select("amount").eq("goal_id", goal_id).execute()
    total = sum(d["amount"] for d in all_deposits.data)

    updated = authed_supabase.table("goals") \
        .update({"current_amount": total}) \
        .eq("id", goal_id) \
        .execute().data[0]

    # Neo4j에도 갱신된 목표 동기화
    if graph_rag:
        try:
            graph_rag.sync_goal(updated)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (입금 추가): {e}")

    return updated

# ✅ 입금 내역 삭제 (DELETE /goals/{goal_id}/deposits/{deposit_id})
# 삭제 후 current_amount 자동 재계산
@router.delete("/{goal_id}/deposits/{deposit_id}")
def delete_deposit(goal_id: str, deposit_id: str, authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 입금 내역 삭제
    authed_supabase.table("goal_deposits") \
        .delete() \
        .eq("id", deposit_id) \
        .eq("user_id", user_id) \
        .execute()

    # current_amount 재계산
    all_deposits = authed_supabase.table("goal_deposits").select("amount").eq("goal_id", goal_id).execute()
    total = sum(d["amount"] for d in all_deposits.data)

    updated = authed_supabase.table("goals") \
        .update({"current_amount": total}) \
        .eq("id", goal_id) \
        .execute().data[0]

    # Neo4j에도 갱신된 목표 동기화
    if graph_rag:
        try:
            graph_rag.sync_goal(updated)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (입금 삭제): {e}")

    return updated