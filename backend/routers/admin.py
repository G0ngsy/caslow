# 관리자용 API 라우터
# Neo4j 재동기화 등 유지보수 작업에 사용

from fastapi import APIRouter, Header, HTTPException
from database import get_supabase_with_token
from graph_rag import graph_rag

router = APIRouter(prefix="/admin", tags=["admin"])


def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        from database import supabase
        res = supabase.auth.get_user(token)
        return res.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")


@router.post("/resync-neo4j")
def resync_neo4j(authorization: str = Header(...)):
    """
    Supabase의 지출/목표/정기지출 데이터를 Neo4j에 재동기화
    user_id가 null인 기존 노드 정리 후 올바른 데이터로 다시 저장
    """
    if not graph_rag:
        raise HTTPException(status_code=503, detail="Neo4j 연결이 없습니다.")

    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    results = {"expenses": 0, "goals": 0, "recurring": 0, "errors": []}

    # 1단계: 해당 유저의 null user_id 노드 삭제
    try:
        # Neo4j에서 user_id가 null인 노드 전체 삭제
        graph_rag._run("""
            MATCH (n)
            WHERE n.user_id IS NULL
            DETACH DELETE n
        """)
    except Exception as e:
        results["errors"].append(f"null 노드 삭제 실패: {e}")

    # 2단계: 지출 재동기화
    try:
        expenses = authed_supabase.table("expenses") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute().data
        for expense in expenses:
            graph_rag.sync_expense(expense)
        results["expenses"] = len(expenses)
    except Exception as e:
        results["errors"].append(f"지출 동기화 실패: {e}")

    # 3단계: 목표 재동기화
    try:
        goals = authed_supabase.table("goals") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute().data
        for goal in goals:
            graph_rag.sync_goal(goal)
        results["goals"] = len(goals)
    except Exception as e:
        results["errors"].append(f"목표 동기화 실패: {e}")

    # 4단계: 정기 지출 재동기화
    try:
        recurring = authed_supabase.table("recurring_expenses") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute().data
        for item in recurring:
            graph_rag.sync_recurring(item)
        results["recurring"] = len(recurring)
    except Exception as e:
        results["errors"].append(f"정기 지출 동기화 실패: {e}")

    return {
        "message": "Neo4j 재동기화 완료",
        "synced": results,
    }
