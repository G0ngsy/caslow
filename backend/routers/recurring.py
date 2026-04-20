# 정기 지출 CRUD API 라우터

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from database import supabase, get_supabase_with_token
from graph_rag import CaslowGraphRAG  # Neo4j 연동 추가

router = APIRouter(prefix="/recurring", tags=["recurring"])

class RecurringCreate(BaseModel):
    title: str
    amount: int
    day_of_month: int
    category: str

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ 정기 지출 목록 조회
@router.get("/")
def get_recurring(authorization: str = Header(...)):
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("recurring_expenses") \
        .select("*") \
        .eq("user_id", user_id) \
        .execute()

    return response.data

# ✅ 정기 지출 추가
@router.post("/")
def create_recurring(item: RecurringCreate, authorization: str = Header(...)):
    """정기 지출 추가 후 Neo4j에도 동기화"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    data = {
        "user_id": user_id,
        "title": item.title,
        "amount": item.amount,
        "day_of_month": item.day_of_month,
        "category": item.category,
    }

    response = authed_supabase.table("recurring_expenses").insert(data).execute()
    saved = response.data[0]

    # Neo4j에 정기 지출 노드 동기화
    try:
        rag = CaslowGraphRAG()
        rag.sync_recurring(saved)
        rag.close()
    except Exception as e:
        print(f"⚠️ Neo4j 동기화 실패 (정기 지출 생성): {e}")

    return saved

# ✅ 제목 기준 정기 지출 삭제
@router.delete("/by-title")
def delete_recurring_by_title(title: str, authorization: str = Header(...)):
    """제목으로 정기 지출 삭제 후 Neo4j에서도 제거"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("recurring_expenses") \
        .delete() \
        .eq("user_id", user_id) \
        .like("title", f"%{title}%") \
        .execute()

    # Neo4j에서도 해당 정기 지출들 삭제
    try:
        rag = CaslowGraphRAG()
        for item in response.data:
            rag.delete_recurring(str(item['id']))
        rag.close()
    except Exception as e:
        print(f"⚠️ Neo4j 동기화 실패 (제목 기준 삭제): {e}")

    return {"message": "삭제되었습니다."}

# ✅ 정기 지출 삭제
@router.delete("/{item_id}")
def delete_recurring(item_id: str, authorization: str = Header(...)):
    """정기 지출 삭제 후 Neo4j에서도 제거"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("recurring_expenses") \
        .delete() \
        .eq("id", item_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="정기 지출을 찾을 수 없습니다.")

    # Neo4j에서도 해당 노드 삭제
    try:
        rag = CaslowGraphRAG()
        rag.delete_recurring(item_id)
        rag.close()
    except Exception as e:
        print(f"⚠️ Neo4j 동기화 실패 (정기 지출 삭제): {e}")

    return {"message": "삭제되었습니다."}