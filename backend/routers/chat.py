# AI 채팅 API 라우터
# Groq API를 사용해서 LLaMA 모델로 대화해요

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import List
from groq import Groq
from database import supabase, get_supabase_with_token  # get_supabase_with_token: goal-advice에서 사용
import os
from dotenv import load_dotenv
from graph_rag import graph_rag

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
    except Exception as e:
        print(f"⚠️ 인증 실패: {e}")
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ AI 채팅 (POST /chat)
@router.post("/")
def chat(request: ChatRequest, authorization: str = Header(...)):
    """유저 메시지를 GraphRAG로 탐색 후 Groq API로 전송"""
    user_id = get_user_id(authorization)

    # 유저 마지막 질문으로 Neo4j에서 관련 노드 탐색 (유저 데이터만)
    last_message = request.messages[-1].content if request.messages else ""
    graph_context = graph_rag.search(last_message, user_id) if graph_rag else ""

    # 시스템 프롬프트에 GraphRAG 컨텍스트 포함
    system_prompt = f"""당신은 Caslow의 AI 재무 관리 어시스턴트입니다.
반드시 한국어로만 답변하세요. 다른 언어는 절대 사용하지 마세요.
사용자의 지출 데이터를 바탕으로 친절하고 실용적인 재무 조언을 제공합니다.
구체적인 수치와 함께 조언해주세요.
답변은 간결하고 친근한 말투로 해주세요.

아래는 사용자의 재무 데이터 분석 결과입니다:
{graph_context}
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
    """GraphRAG 기반 AI 인사이트 생성"""
    user_id = get_user_id(authorization)

    if not graph_rag:
        return {"insight": "AI 분석을 일시적으로 사용할 수 없어요. 잠시 후 다시 시도해주세요."}

    # Neo4j에서 지출 패턴 탐색 (유저 데이터만)
    graph_context = graph_rag.search("지출 패턴 분석 절약", user_id)

    if not graph_context:
        return {"insight": "이번 달 지출 내역이 없어요. 지출을 입력하면 AI가 분석해드릴게요! 😊"}

    # Groq API로 인사이트 생성
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """당신은 재무 분석 AI입니다. 반드시 한국어로만 답변하세요.
사용자의 지출 데이터를 분석해서 2~3줄의 간결한 인사이트를 제공해주세요.
구체적인 금액과 카테고리를 언급하고, 절약 팁을 한 가지 제안해주세요."""
            },
            {
                "role": "user",
                "content": f"다음 지출 데이터를 분석해주세요:\n{graph_context}"
            }
        ],
        max_tokens=300,
        temperature=0.7,
    )

    return {"insight": response.choices[0].message.content}


# ✅ 목표 화면 AI 조언 (GET /chat/goal-advice/{goal_id})
@router.get("/goal-advice/{goal_id}")
def get_goal_advice(goal_id: str, authorization: str = Header(...)):
    """GraphRAG 기반 목표 AI 조언 생성"""
    user_id = get_user_id(authorization)
    authed_supabase = get_supabase_with_token(authorization.replace("Bearer ", ""))

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

    # Neo4j에서 목표 관련 컨텍스트 탐색 (유저 데이터만)
    graph_context = graph_rag.search(f"목표 {goal_data['title']} 저축 달성 패턴", user_id) if graph_rag else ""

    # Groq API로 조언 생성
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """당신은 재무 목표 코치 AI입니다. 반드시 한국어로만 답변하세요.
사용자의 목표 달성 현황과 지출 패턴을 분석해서 2~3줄의 실용적인 조언을 해주세요.
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

GraphRAG 분석 결과:
{graph_context}

위 데이터를 바탕으로 목표 달성을 위한 조언을 해주세요."""
            }
        ],
        max_tokens=300,
        temperature=0.7,
    )

    return {"advice": response.choices[0].message.content}