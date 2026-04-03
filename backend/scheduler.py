# 정기 지출 자동 등록 스케줄러
# APScheduler를 사용해서 매일 자정에 실행돼요
# 오늘 날짜가 정기 지출의 day_of_month와 같으면 자동으로 지출을 추가해요

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import date
from database import supabase

# 스케줄러 인스턴스 생성
scheduler = AsyncIOScheduler()

async def process_recurring_expenses():
    """
    매일 자정에 실행되는 함수
    오늘 날짜의 day와 일치하는 정기 지출을 expenses 테이블에 자동 추가
    """
    today = date.today()
    today_day = today.day  # 오늘이 몇 일인지 (1~31)

    print(f"[스케줄러] {today} 정기 지출 처리 시작...")

    # 오늘 날짜와 일치하는 정기 지출 목록 조회
    response = supabase.table("recurring_expenses") \
        .select("*") \
        .eq("day_of_month", today_day) \
        .execute()

    recurring_list = response.data

    for item in recurring_list:
        # 이미 오늘 등록된 지출인지 확인 (중복 방지)
        existing = supabase.table("expenses") \
            .select("id") \
            .eq("user_id", item["user_id"]) \
            .eq("category", item["category"]) \
            .eq("date", str(today)) \
            .eq("amount", item["amount"]) \
            .execute()

        if not existing.data:
            # 아직 등록 안 됐으면 지출 추가
            supabase.table("expenses").insert({
                "user_id": item["user_id"],
                "amount": item["amount"],
                "category": item["category"],
                "memo": f"[정기] {item['title']}",
                "date": str(today),
            }).execute()
            print(f"[스케줄러] 정기 지출 추가: {item['title']} - {item['amount']}원")

    print(f"[스케줄러] 처리 완료! 총 {len(recurring_list)}건")


def start_scheduler():
    """
    스케줄러 시작 함수
    매일 자정(00:00)에 process_recurring_expenses 실행
    """
    scheduler.add_job(
        process_recurring_expenses,
        trigger="cron",
        hour=0,
        minute=0,
        id="recurring_expenses_job"
    )
    scheduler.start()
    print("[스케줄러] 시작됨 - 매일 자정 정기 지출 자동 등록")