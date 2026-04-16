# 정기 지출 자동 등록 스케줄러
# APScheduler를 사용해서 매일 자정에 실행돼요
# 오늘 날짜가 정기 지출의 day_of_month와 같으면 자동으로 지출을 추가해요

from apscheduler.schedulers.background import BackgroundScheduler  # AsyncIO → Background
from datetime import date
from database import supabase
from routers.slack import send_daily_advice
from routers.email_alert import send_daily_email_advice

# 스케줄러 인스턴스 생성
scheduler = BackgroundScheduler()

def process_recurring_expenses():  # async 제거
    """매일 자정에 실행되는 함수"""
    today = date.today()
    today_day = today.day

    print(f"[스케줄러] {today} 정기 지출 처리 시작...")

    response = supabase.table("recurring_expenses") \
        .select("*") \
        .eq("day_of_month", today_day) \
        .execute()

    recurring_list = response.data

    for item in recurring_list:
        existing = supabase.table("expenses") \
            .select("id") \
            .eq("user_id", item["user_id"]) \
            .eq("category", item["category"]) \
            .eq("date", str(today)) \
            .eq("amount", item["amount"]) \
            .execute()

        if not existing.data:
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
    # 기존 정기 지출 스케줄러
    scheduler.add_job(
        process_recurring_expenses,
        trigger="cron",
        hour=0,
        minute=0,
        id="recurring_expenses_job"
    )
    
    # 매일 아침 8시 슬랙 알림 추가
    scheduler.add_job(
        send_daily_advice,
        trigger="cron",
        hour=8,
        minute=0,
        id="daily_slack_advice_job"
    )
    
    scheduler.start()
    print("[스케줄러] 시작됨 - 매일 자정 정기 지출 + 매일 8시 슬랙 알림")
    
    def start_scheduler():
    # 기존 정기 지출 스케줄러
        scheduler.add_job(
            process_recurring_expenses,
            trigger="cron",
            hour=0,
            minute=0,
            id="recurring_expenses_job"
        )

        # 매일 아침 8시 슬랙 알림
        scheduler.add_job(
            send_daily_advice,
            trigger="cron",
            hour=8,
            minute=0,
            id="daily_slack_advice_job"
        )

        # 매일 아침 8시 이메일 알림 추가
        scheduler.add_job(
            send_daily_email_advice,
            trigger="cron",
            hour=8,
            minute=0,
            id="daily_email_advice_job"
        )

        scheduler.start()
        print("[스케줄러] 시작됨")