# 지출 CRUD API 라우터
# CRUD = Create(생성), Read(조회), Update(수정), Delete(삭제)

from fastapi import APIRouter, HTTPException, Header
from database import supabase, get_supabase_with_token
from models.expense import ExpenseCreate, ExpenseUpdate
from datetime import date, datetime
from collections import defaultdict

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
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")


# ✅ 지출 목록 조회 (GET /expenses)
@router.get("/")
def get_expenses(authorization: str = Header(...)):
    """로그인한 사용자의 지출 목록을 날짜 최신순으로 반환"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")

    # 유저 토큰으로 인증된 클라이언트 사용 (RLS 통과)
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("expenses") \
        .select("*") \
        .eq("user_id", user_id) \
        .order("date", desc=True) \
        .execute()

    return response.data


# ✅ 지출 생성 (POST /expenses)
@router.post("/")
def create_expense(expense: ExpenseCreate, authorization: str = Header(...)):
    """새로운 지출 항목을 추가"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")

    # 유저 토큰으로 인증된 클라이언트 사용 (RLS 통과)
    authed_supabase = get_supabase_with_token(token)

    # 저장할 데이터 준비
    data = {
        "user_id": user_id,
        "title": expense.title,
        "amount": expense.amount,
        "category": expense.category,
        "memo": expense.memo,
        "date": str(expense.date),
    }

    response = authed_supabase.table("expenses").insert(data).execute()
    return response.data[0]


# ✅ 지출 수정 (PUT /expenses/{id})
@router.put("/{expense_id}")
def update_expense(expense_id: str, expense: ExpenseUpdate, authorization: str = Header(...)):
    """특정 지출 항목 수정"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")

    # 유저 토큰으로 인증된 클라이언트 사용 (RLS 통과)
    authed_supabase = get_supabase_with_token(token)

    # None이 아닌 값만 업데이트
    data = {k: v for k, v in expense.dict().items() if v is not None}

    # date는 문자열로 변환
    if "date" in data:
        data["date"] = str(data["date"])

    response = authed_supabase.table("expenses") \
        .update(data) \
        .eq("id", expense_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="지출 항목을 찾을 수 없습니다.")

    return response.data[0]

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

    return {"message": "삭제되었습니다.", "count": len(response.data)}

# ✅ 지출 삭제 (DELETE /expenses/{id})
@router.delete("/{expense_id}")
def delete_expense(expense_id: str, authorization: str = Header(...)):
    """특정 지출 항목 삭제"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")

    # 유저 토큰으로 인증된 클라이언트 사용 (RLS 통과)
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("expenses") \
        .delete() \
        .eq("id", expense_id) \
        .eq("user_id", user_id) \
        .execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="지출 항목을 찾을 수 없습니다.")

    return {"message": "삭제되었습니다."}

# ✅ 카테고리별 지출 합계 (GET /expenses/analysis/category)
# ✅ 카테고리별 지출 합계 (탭 필터 포함)
@router.get("/analysis/category")
def get_expenses_by_category(
    authorization: str = Header(...),
    tab: str = "all"
):
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    today = date.today()
    first_day = today.replace(day=1)

    # 전체 데이터 가져오기
    response = authed_supabase.table("expenses") \
        .select("category, amount, memo") \
        .eq("user_id", user_id) \
        .gte("date", str(first_day)) \
        .execute()

    # 한글 카테고리명 → 영문 키 정규화
    korean_to_key = {
        '카페': 'cafe', '음식': 'food', '교통': 'transport',
        '쇼핑': 'shopping', '구독': 'subscription', '기타': 'etc',
    }

    category_totals = defaultdict(int)
    for expense in response.data:
        memo = expense.get("memo") or ""

        # 탭 필터 적용
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
def get_expenses_by_month(authorization: str = Header(...)):
    """최근 6개월 월별 지출 합계 반환"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    response = authed_supabase.table("expenses") \
        .select("date, amount") \
        .eq("user_id", user_id) \
        .execute()

    # 월별 합산
    monthly_totals = defaultdict(int)
    for expense in response.data:
        month = expense["date"][:7]  # "2026-04" 형식
        monthly_totals[month] += expense["amount"]

    # 최근 6개월 정렬
    sorted_months = sorted(monthly_totals.items())[-6:]

    return [{"month": k, "amount": v} for k, v in sorted_months]

