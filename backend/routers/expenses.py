# 지출 CRUD API 라우터
# CRUD = Create(생성), Read(조회), Update(수정), Delete(삭제)

from fastapi import APIRouter, HTTPException, Header
from database import supabase, get_supabase_with_token
from models.expense import ExpenseCreate, ExpenseUpdate
from datetime import date, datetime, timedelta, timezone
from collections import defaultdict
from graph_rag import graph_rag  # Neo4j 싱글톤 인스턴스
import httpx
from typing import Optional
from date_utils import month_range, trailing_months, validate_year_month

# 라우터 생성 - /expenses 경로로 시작하는 API들을 모아요
router = APIRouter(prefix="/expenses", tags=["expenses"])


def get_user_id(authorization: str) -> str:
    """
    Authorization 헤더에서 사용자 ID를 가져오는 함수
    프론트에서 로그인 토큰을 보내면 Supabase에서 사용자 확인
    """
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception as e:
        print(f"⚠️ 인증 실패: {e}")
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")


# ✅ 지출 목록 조회 (GET /expenses)
@router.get("/")
def get_expenses(
    authorization: str = Header(...),
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    """로그인한 사용자의 지출 목록을 날짜 최신순으로 반환한다.

    year/month를 함께 넘기면 해당 월만 조회한다. 기존 클라이언트 호환을 위해
    두 값이 모두 없을 때는 전체 목록을 반환한다.
    """
    if (year is None) != (month is None):
        raise HTTPException(status_code=422, detail="year와 month는 함께 입력해야 합니다.")
    if year is not None and month is not None:
        try:
            validate_year_month(year, month)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")

    # 유저 토큰으로 인증된 클라이언트 사용 (RLS 통과)
    authed_supabase = get_supabase_with_token(token)

    query = authed_supabase.table("expenses") \
        .select("*") \
        .eq("user_id", user_id)

    if year is not None and month is not None:
        start, end = month_range(year, month)
        query = query.gte("date", str(start)).lt("date", str(end))

    response = query \
        .order("date", desc=True) \
        .execute()

    return response.data


# ✅ 지출 생성 (POST /expenses)
@router.post("/")
def create_expense(expense: ExpenseCreate, authorization: str = Header(...)):
    """새로운 지출 항목을 추가하고 Neo4j에도 동기화"""
    if expense.date > date.today():
        raise HTTPException(status_code=422, detail="미래 날짜의 지출은 등록할 수 없습니다.")
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # Supabase에 저장
    data = {
        "user_id": user_id,
        "title": expense.title,
        "amount": expense.amount,
        "category": expense.category,
        "memo": expense.memo,
        "date": str(expense.date),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    response = authed_supabase.table("expenses").insert(data).execute()
    if not response.data:
        raise HTTPException(status_code=500, detail="지출 저장에 실패했습니다.")
    saved = response.data[0]

    # Neo4j에 지출 노드 동기화 (전체 재구성 없이 해당 노드만 추가)
    if graph_rag:
        try:
            graph_rag.sync_expense(saved)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (지출 생성): {e}")

    # 예산 초과 시 푸시 알림 전송
    try:
        expense_month = expense.date.strftime("%Y-%m")
        budget_row = authed_supabase.table("budgets") \
            .select("amount") \
            .eq("user_id", user_id) \
            .eq("year", expense.date.year) \
            .eq("month", expense.date.month) \
            .execute()
        if budget_row.data:
            budget_amount = budget_row.data[0]["amount"]
            month_expenses = authed_supabase.table("expenses") \
                .select("amount") \
                .eq("user_id", user_id) \
                .like("date", f"{expense_month}%") \
                .execute()
            total = sum(e["amount"] for e in month_expenses.data)
            if total > budget_amount:
                profile = authed_supabase.table("profiles").select("push_token").eq("user_id", user_id).execute()
                if profile.data and profile.data[0].get("push_token"):
                    push_token = profile.data[0]["push_token"]
                    over = total - budget_amount
                    httpx.post("https://exp.host/--/api/v2/push/send", json={
                        "to": push_token,
                        "title": "⚠️ 예산 초과!",
                        "body": f"이번 달 예산을 {over:,}원 초과했어요.",
                        "sound": "default",
                    }, timeout=5)
    except Exception as e:
        print(f"⚠️ 예산 초과 알림 실패: {e}")

    return saved

# ✅ 지출 수정 (PUT /expenses/{id})
@router.put("/{expense_id}")
def update_expense(expense_id: str, expense: ExpenseUpdate, authorization: str = Header(...)):
    """특정 지출 항목 수정 후 Neo4j에도 동기화"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # None이 아닌 값만 업데이트
    data = {k: v for k, v in expense.model_dump().items() if v is not None}
    if "date" in data:
        if data["date"] > date.today():
            raise HTTPException(status_code=422, detail="미래 날짜의 지출은 등록할 수 없습니다.")
        data["date"] = str(data["date"])

    response = authed_supabase.table("expenses") \
        .update(data) \
        .eq("id", expense_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="지출 항목을 찾을 수 없습니다.")

    updated = response.data[0]

    # Neo4j에 수정된 노드 동기화 (MERGE로 덮어쓰기)
    if graph_rag:
        try:
            graph_rag.sync_expense(updated)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (지출 수정): {e}")

    return updated

# ✅ 메모 기준 지출 삭제 (DELETE /expenses/by-memo)
@router.delete("/by-memo")
def delete_expenses_by_memo(memo: str, authorization: str = Header(...)):
    """메모에 특정 텍스트가 포함된 지출 삭제 (정기 지출 삭제 시 사용)"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("expenses") \
        .delete() \
        .eq("user_id", user_id) \
        .like("memo", f"%{memo}%") \
        .execute()

    # Neo4j에서도 해당 지출들 삭제
    if graph_rag:
        try:
            for item in response.data:
                graph_rag.delete_expense(str(item['id']))
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (메모 기준 삭제): {e}")

    return {"message": "삭제되었습니다.", "count": len(response.data)}

# ✅ 지출 삭제 (DELETE /expenses/{id})
@router.delete("/{expense_id}")
def delete_expense(expense_id: str, authorization: str = Header(...)):
    """특정 지출 항목 삭제 후 Neo4j에서도 제거"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("expenses") \
        .delete() \
        .eq("id", expense_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="지출 항목을 찾을 수 없습니다.")

    # Neo4j에서도 해당 노드 삭제
    if graph_rag:
        try:
            graph_rag.delete_expense(expense_id)
        except Exception as e:
            print(f"⚠️ Neo4j 동기화 실패 (지출 삭제): {e}")

    return {"message": "삭제되었습니다."}

# ✅ 카테고리별 지출 합계 (GET /expenses/analysis/category)
# ✅ 카테고리별 지출 합계 (탭 필터 포함)
@router.get("/analysis/category")
def get_expenses_by_category(
    authorization: str = Header(...),
    tab: str = "all",
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    if (year is None) != (month is None):
        raise HTTPException(status_code=422, detail="year와 month는 함께 입력해야 합니다.")
    if tab not in {"all", "fixed", "variable"}:
        raise HTTPException(status_code=422, detail="tab 값이 올바르지 않습니다.")

    today = date.today()
    target_year = year if year is not None else today.year
    target_month = month if month is not None else today.month
    try:
        first_day, next_month = month_range(target_year, target_month)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    range_end = min(next_month, today + timedelta(days=1)) if first_day <= today < next_month else next_month

    # 오늘 이하 날짜만 조회 (미래 날짜 제외)
    response = authed_supabase.table("expenses") \
        .select("category, amount, memo") \
        .eq("user_id", user_id) \
        .gte("date", str(first_day)) \
        .lt("date", str(range_end)) \
        .execute()

    korean_to_key = {
        '카페': 'cafe', '음식': 'food', '교통': 'transport',
        '쇼핑': 'shopping', '구독': 'subscription', '기타': 'etc',
    }

    category_totals = defaultdict(int)
    for expense in response.data:
        memo = expense.get("memo") or ""

        if tab == "fixed" and "[정기]" not in memo:
            continue
        if tab == "variable" and "[정기]" in memo:
            continue

        raw = expense["category"]
        key = korean_to_key.get(raw, raw)
        category_totals[key] += expense["amount"]

    return [{"category": k, "amount": v} for k, v in category_totals.items()]



# ✅ 월별 지출 합계 (GET /expenses/analysis/monthly)
@router.get("/analysis/monthly")
def get_expenses_by_month(
    authorization: str = Header(...),
    year: Optional[int] = None,
    month: Optional[int] = None,
):
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    if (year is None) != (month is None):
        raise HTTPException(status_code=422, detail="year와 month는 함께 입력해야 합니다.")
    today = date.today()
    target_year = year if year is not None else today.year
    target_month = month if month is not None else today.month
    try:
        months = trailing_months(target_year, target_month, 6)
        first_day, _ = month_range(*months[0])
        _, next_month = month_range(target_year, target_month)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    range_end = min(next_month, today + timedelta(days=1)) if (target_year, target_month) == (today.year, today.month) else next_month

    response = authed_supabase.table("expenses") \
        .select("date, amount") \
        .eq("user_id", user_id) \
        .gte("date", str(first_day)) \
        .lt("date", str(range_end)) \
        .execute()

    monthly_totals = defaultdict(int)
    for expense in response.data:
        month = expense["date"][:7]
        monthly_totals[month] += expense["amount"]

    return [
        {"month": f"{item_year:04d}-{item_month:02d}", "amount": monthly_totals[f"{item_year:04d}-{item_month:02d}"]}
        for item_year, item_month in months
    ]
