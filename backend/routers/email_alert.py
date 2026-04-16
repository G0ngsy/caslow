# 이메일 알림 라우터
# SendGrid로 매일 아침 8시 AI 소비 조언 이메일 전송

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email as SendGridEmail, To
from groq import Groq
from database import supabase, supabase_admin
from collections import defaultdict
from datetime import date, timedelta
from dotenv import load_dotenv
from fastapi import APIRouter


load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")  # 발신자 이메일

router = APIRouter(prefix="/email", tags=["email"])

# ✅ 이메일 알림 즉시 테스트 (GET /email/test)
@router.get("/test")
def test_email():
    """이메일 알림 즉시 테스트"""
    send_daily_email_advice()
    return {"success": True, "message": "이메일 발송 완료!"}

def send_email(to_email: str, subject: str, content: str):
    """SendGrid로 이메일 전송"""
    message = Mail()
    message.from_email = SendGridEmail(SENDGRID_FROM_EMAIL, "Caslow")
    message.to = To(to_email)
    message.subject = subject
    message.html_content = content
    
    sg = SendGridAPIClient(SENDGRID_API_KEY)
    try:
        response = sg.send(message)
        print(f"[이메일] 발송 성공: {response.status_code}")
    except Exception as e:
        print(f"[이메일] 발송 실패: {e.body}")
        raise
    
    
def send_daily_email_advice():
    """매일 아침 8시 실행 - 개인별 이메일 전송"""
    yesterday = str(date.today() - timedelta(days=1))
    today = str(date.today())

    # 모든 유저 이메일 조회 (Supabase auth)
    users = supabase_admin.auth.admin.list_users()

    for user in users:
        user_email = user.email  # email → user_email
        user_id = user.id
        if not user_email:
            continue

        # 유저별 어제 지출 조회
        response = supabase.table("expenses") \
            .select("*") \
            .eq("user_id", user_id) \
            .gte("date", yesterday) \
            .lte("date", today) \
            .execute()

        expenses = response.data

        # 카테고리별 합계
        category_totals = defaultdict(int)
        total = 0
        for e in expenses:
            category_totals[e["category"]] += e["amount"]
            total += e["amount"]

        # 지출 없으면 기본 메시지
        if not expenses:
            html = """
            <h2>🌅 Caslow 오늘의 소비 조언</h2>
            <p>어제 지출 내역이 없어요! 오늘도 현명한 소비 하세요 😊</p>
            """
            send_email(user_email, "🌅 Caslow 오늘의 소비 조언", html)
            continue

        # 카테고리 요약
        category_summary = "".join([
            f"<li>{cat}: {amount:,}원</li>"
            for cat, amount in category_totals.items()
        ])

        # Groq로 AI 조언 생성
        prompt = f"""
어제 지출: 총 {total:,}원 ({len(expenses)}건)
카테고리별: {dict(category_totals)}

오늘의 소비 조언을 2~3줄로 친근하고 실용적으로 반드시 한국어로 작성해주세요.
"""
        ai_response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7,
        )
        advice = ai_response.choices[0].message.content

        # HTML 이메일 템플릿
        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #255DAA;">🌅 Caslow 오늘의 소비 조언</h2>
            
            <div style="background: #E3F2FF; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #1B1E3E;">📊 어제 지출 요약</h3>
                <p>총 <strong>{total:,}원</strong> ({len(expenses)}건)</p>
                <ul>{category_summary}</ul>
            </div>

            <div style="background: #FFF9E6; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #1B1E3E;">💡 AI 조언</h3>
                <p>{advice}</p>
            </div>

            <p style="color: #888; font-size: 12px;">
                Caslow AI가 분석한 맞춤 소비 조언이에요 😊
            </p>
        </div>
        """

        send_email(user_email, "🌅 Caslow 오늘의 소비 조언", html)

    print(f"[이메일] {len(users)}명에게 발송 완료!")