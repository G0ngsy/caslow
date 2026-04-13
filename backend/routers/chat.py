# AI 채팅 API 라우터
# Groq API를 사용해서 LLaMA 모델로 대화해요

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
from database import supabase, get_supabase_with_token
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/chat", tags=["chat"])

# Groq 클라이언트 초기화
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 메시지 데이터 타입
class Message(BaseModel):
    role: str      # "user" 또는 "assistant"
    content: str   # 메시지 내용

class ChatRequest(BaseModel):
    messages: List[Message]  # 대화 내역

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ AI 채팅 (POST /chat)
@router.post("/")
def chat(request: ChatRequest, authorization: str = Header(...)):
    """유저 메시지를 Groq API로 전송하고 AI 응답 반환"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 유저의 이번 달 지출 데이터 가져오기
    from datetime import date
    today = date.today()
    first_day = today.replace(day=1)

    expenses = authed_supabase.table("expenses") \
        .select("title, amount, category, date, memo") \
        .eq("user_id", user_id) \
        .gte("date", str(first_day)) \
        .execute()

    # 지출 데이터를 텍스트로 변환
    expense_text = ""
    if expenses.data:
        total = sum(e["amount"] for e in expenses.data)
        expense_text = f"이번 달 총 지출: {total:,}원\n\n지출 내역:\n"
        for e in expenses.data:
            expense_text += f"- {e['date']} {e.get('title', '')} ({e['category']}): {e['amount']:,}원\n"
    else:
        expense_text = "이번 달 지출 내역이 없습니다."

    # 시스템 프롬프트 설정
    system_prompt = f"""당신은 Caslow의 AI 재무 관리 어시스턴트입니다.
반드시 한국어로만 답변하세요. 다른 언어는 절대 사용하지 마세요.
사용자의 지출 데이터를 바탕으로 친절하고 실용적인 재무 조언을 제공합니다.
구체적인 수치와 함께 조언해주세요.
답변은 간결하고 친근한 말투로 해주세요.

현재 사용자의 지출 현황:
{expense_text}
"""

    # Groq API 호출
    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in request.messages]

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1000,
        temperature=0.7,
    )

    return {"message": response.choices[0].message.content}

# ✅ 분석 화면 AI 인사이트 (GET /chat/insight)
@router.get("/insight")
def get_insight(authorization: str = Header(...)):
    """이번 달 지출 데이터 기반으로 AI 인사이트 생성"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 이번 달 지출 데이터 가져오기
    from datetime import date
    today = date.today()
    first_day = today.replace(day=1)

    expenses = authed_supabase.table("expenses") \
        .select("title, amount, category, date, memo") \
        .eq("user_id", user_id) \
        .gte("date", str(first_day)) \
        .execute()

    if not expenses.data:
        return {"insight": "이번 달 지출 내역이 없어요. 지출을 입력하면 AI가 분석해드릴게요! 😊"}

    # 지출 데이터 텍스트로 변환
    total = sum(e["amount"] for e in expenses.data)
    expense_text = f"이번 달 총 지출: {total:,}원\n\n지출 내역:\n"
    for e in expenses.data:
        expense_text += f"- {e['date']} {e.get('title', '')} ({e['category']}): {e['amount']:,}원\n"

    # Groq API로 인사이트 생성
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """당신은 재무 분석 AI입니다. 반드시 한국어로만 답변하세요.
사용자의 이번 달 지출 데이터를 분석해서 2~3줄의 간결한 인사이트를 제공해주세요.
구체적인 금액과 카테고리를 언급하고, 절약 팁을 한 가지 제안해주세요."""
            },
            {
                "role": "user",
                "content": f"다음 지출 데이터를 분석해주세요:\n{expense_text}"
            }
        ],
        max_tokens=300,
        temperature=0.7,
    )

    return {"insight": response.choices[0].message.content}

# ✅ 목표 화면 AI 조언 (GET /chat/goal-advice/{goal_id})
@router.get("/goal-advice/{goal_id}")
def get_goal_advice(goal_id: str, authorization: str = Header(...)):
    """목표 데이터 기반으로 AI 조언 생성"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 목표 데이터 가져오기
    goal = authed_supabase.table("goals") \
        .select("*") \
        .eq("id", goal_id) \
        .eq("user_id", user_id) \
        .execute()

    if not goal.data:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다.")

    goal_data = goal.data[0]
    percent = round((goal_data["current_amount"] / goal_data["target_amount"]) * 100) if goal_data["target_amount"] > 0 else 0

    # 이번 달 지출 데이터도 함께 가져오기
    from datetime import date
    today = date.today()
    first_day = today.replace(day=1)

    expenses = authed_supabase.table("expenses") \
        .select("amount, category") \
        .eq("user_id", user_id) \
        .gte("date", str(first_day)) \
        .execute()

    total_expense = sum(e["amount"] for e in expenses.data) if expenses.data else 0

    # Groq API로 조언 생성
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """당신은 재무 목표 코치 AI입니다. 반드시 한국어로만 답변하세요.
사용자의 목표 달성 현황을 분석해서 2~3줄의 실용적인 조언을 해주세요.
구체적인 금액과 달성률을 언급하고, 목표 달성을 위한 팁을 제안해주세요."""
            },
            {
                "role": "user",
                "content": f"""목표 정보:
- 목표명: {goal_data['title']}
- 목표 유형: {goal_data['type']}
- 목표 금액: {goal_data['target_amount']:,}원
- 현재 금액: {goal_data['current_amount']:,}원
- 달성률: {percent}%
- 기한: {goal_data.get('deadline', '없음')}
- 이번 달 총 지출: {total_expense:,}원

위 데이터를 바탕으로 조언해주세요."""
            }
        ],
        max_tokens=300,
        temperature=0.7,
    )

    return {"advice": response.choices[0].message.content}