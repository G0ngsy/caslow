# 슬랙 알림 라우터
# 매일 아침 8시에 AI 소비 조언을 슬랙으로 전송

import requests
import os
from groq import Groq
from database import supabase
from dotenv import load_dotenv
import httpx

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 슬랙 Webhook URL
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")

def send_slack_message(message: str):
    """슬랙 채널에 메시지 전송"""
    requests.post(SLACK_WEBHOOK_URL, json={"text": message})

def send_daily_advice():
    """매일 아침 8시 실행 - 모든 유저 지출 분석 후 슬랙 전송"""
    from datetime import date, timedelta
    from collections import defaultdict

    yesterday = str(date.today() - timedelta(days=1))
    today = str(date.today())

    # 모든 유저 지출 조회
    response = supabase.table("expenses") \
        .select("*") \
        .gte("date", yesterday) \
        .lte("date", today) \
        .execute()

    expenses = response.data
    if not expenses:
        send_slack_message("🌅 *Caslow 오늘의 소비 조언*\n어제 지출 내역이 없어요! 오늘도 현명한 소비 하세요 😊")
        return

    # 카테고리별 합계
    category_totals = defaultdict(int)
    total = 0
    for e in expenses:
        category_totals[e["category"]] += e["amount"]
        total += e["amount"]

    # 카테고리 요약 텍스트
    category_summary = "\n".join([
        f"  → {cat}: {amount:,}원"
        for cat, amount in category_totals.items()
    ])

    # Groq로 AI 조언 생성
    prompt = f"""
다음은 어제 지출 내역이에요:
총 지출: {total:,}원
카테고리별:
{category_summary}

이 지출 패턴을 분석해서 오늘의 소비 조언을 2~3줄로 반드시 한국어로 작성해주세요.
친근하고 실용적으로 작성해주세요.
"""
    ai_response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.7,
    )
    advice = ai_response.choices[0].message.content

    # 슬랙 메시지 전송
    message = f"""🌅 *Caslow 오늘의 소비 조언*

📊 *어제 지출 요약*
  총 {total:,}원 ({len(expenses)}건)
{category_summary}

💡 *AI 조언*
{advice}

_Caslow AI가 분석한 맞춤 소비 조언이에요 😊_"""

    send_slack_message(message)
    

async def send_push_notification(push_token: str, title: str, body: str):
    """Expo 푸시 알림 전송"""
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://exp.host/--/api/v2/push/send",
            json={
                "to": push_token,
                "title": title,
                "body": body,
                "sound": "default",
            }
        )

def send_daily_advice():
    """매일 아침 8시 실행 - 개인별 푸시 알림 전송"""
    import asyncio
    from datetime import date, timedelta
    from collections import defaultdict

    yesterday = str(date.today() - timedelta(days=1))
    today = str(date.today())

    # 모든 유저 푸시 토큰 조회
    profiles = supabase.table("profiles") \
        .select("user_id, push_token") \
        .execute()

    for profile in profiles.data:
        user_id = profile["user_id"]
        push_token = profile.get("push_token")
        if not push_token:
            continue

        # 유저별 지출 조회
        expenses = supabase.table("expenses") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", yesterday) \
            .lte("date", today) \
            .execute()

        if not expenses.data:
            # 지출 없으면 기본 메시지
            asyncio.run(send_push_notification(
                push_token,
                "🌅 Caslow 오늘의 소비 조언",
                "어제 지출 내역이 없어요! 오늘도 현명한 소비 하세요 😊"
            ))
            continue

        # 총 지출 계산
        total = sum(e["amount"] for e in expenses.data)
        count = len(expenses.data)

        # Groq로 AI 조언 생성
        category_totals = defaultdict(int)
        for e in expenses.data:
            category_totals[e["category"]] += e["amount"]

        category_summary = ", ".join([
            f"{cat} {amount:,}원"
            for cat, amount in category_totals.items()
        ])

        prompt = f"""
어제 지출: 총 {total:,}원 ({count}건)
카테고리: {category_summary}

오늘의 소비 조언을 1~2줄로 짧게 한국어로 작성해주세요.
"""
        ai_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
            temperature=0.7,
        )
        advice = ai_response.choices[0].message.content

        # 개인별 푸시 알림 전송
        asyncio.run(send_push_notification(
            push_token,
            "🌅 Caslow 오늘의 소비 조언",
            f"어제 {total:,}원 지출 | {advice}"
        ))

    # 슬랙에도 전송 (관리자용)
    send_slack_message(f"✅ 오늘 아침 8시 푸시 알림 전송 완료! ({len(profiles.data)}명)")