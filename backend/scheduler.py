# 정기 지출 자동 등록 스케줄러
# APScheduler를 사용해서 매일 자정에 실행돼요
# 오늘 날짜가 정기 지출의 day_of_month와 같으면 자동으로 지출을 추가해요

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import date
from database import supabase
from routers.email_alert import send_daily_email_advice
from graph_rag import graph_rag  # Neo4j 싱글톤 인스턴스

# 스케줄러 인스턴스 생성
scheduler = BackgroundScheduler()

def process_recurring_expenses():
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
        # 이미 오늘 추가된 정기 지출인지 확인 (중복 방지)
        existing = supabase.table("expenses") \
            .select("id") \
            .eq("user_id", item["user_id"]) \
            .eq("category", item["category"]) \
            .eq("date", str(today)) \
            .eq("amount", item["amount"]) \
            .execute()

        if not existing.data:
            # Supabase에 지출 추가
            result = supabase.table("expenses").insert({
                "user_id": item["user_id"],
                "title": item["title"],
                "amount": item["amount"],
                "category": item["category"],
                "memo": f"[정기] {item['title']}",
                "date": str(today),
            }).execute()

            print(f"[스케줄러] 정기 지출 추가: {item['title']} - {item['amount']}원")

            # Neo4j에도 동기화 (자동 추가된 지출도 그래프에 반영)
            if graph_rag:
                try:
                    graph_rag.sync_expense(result.data[0])
                    print(f"[스케줄러] Neo4j 동기화 완료: {item['title']}")
                except Exception as e:
                    print(f"[스케줄러] ⚠️ Neo4j 동기화 실패: {e}")

    print(f"[스케줄러] 처리 완료! 총 {len(recurring_list)}건")


def start_scheduler():
    # 매일 자정 정기 지출 자동 등록
    scheduler.add_job(
        process_recurring_expenses,
        trigger="cron",
        hour=0,
        minute=0,
        id="recurring_expenses_job"
    )

    # 매일 오전 10시 이메일 알림 (UTC 1시 = KST 10시)
    scheduler.add_job(
        send_daily_email_advice,
        trigger="cron",
        hour=1,
        minute=0,
        id="daily_email_advice_job"
    )

    scheduler.start()
    print("[스케줄러] 시작됨 - 매일 자정 정기 지출 + 매일 10시 이메일 알림")