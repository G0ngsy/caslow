# OCR API 라우터
# Groq Vision API (llama-4-scout)로 영수증 이미지 인식

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from groq import Groq
from database import supabase
import os
import base64
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/ocr", tags=["ocr"])

# Groq 클라이언트 초기화
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# 요청 데이터 타입
class OCRRequest(BaseModel):
    image_base64: str  # base64로 인코딩된 이미지
    mime_type: str = "image/jpeg"  # 이미지 타입

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ 영수증 OCR (POST /ocr)
@router.post("/")
def recognize_receipt(request: OCRRequest, authorization: str = Header(...)):
    """영수증 이미지를 분석해서 지출 정보 추출"""
    get_user_id(authorization)

    # Groq Vision API 호출
    response = groq_client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{request.mime_type};base64,{request.image_base64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": """이 영수증 이미지를 분석해서 아래 JSON 형식으로만 응답해주세요.
다른 텍스트는 절대 포함하지 마세요.

{
  "title": "가맹점명 또는 상품명",
  "amount": 숫자만 (원화 금액),
  "date": "YYYY-MM-DD 형식",
  "category": "카페/음식/교통/쇼핑/구독/기타 중 하나",
  "memo": "기타 참고사항 (없으면 빈 문자열)"
}

금액을 찾을 수 없으면 amount를 0으로,
날짜를 찾을 수 없으면 date를 오늘 날짜로 설정해주세요."""
                    }
                ]
            }
        ],
        max_tokens=300,
        temperature=0.1,  # 낮은 온도로 정확한 JSON 출력
        # response_format은 Groq Vision 모델에서 미지원 - 제거
    )

    # 응답 파싱
    import json
    import re
    try:
        content = response.choices[0].message.content
        # JSON 블록이 마크다운 코드블록으로 감싸져 있을 경우 추출
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            content = json_match.group()
        result = json.loads(content)
        return {
            "success": True,
            "data": {
                "title": result.get("title", ""),
                "amount": int(result.get("amount", 0)),
                "date": result.get("date", ""),
                "category": result.get("category", "기타"),
                "memo": result.get("memo", ""),
            }
        }
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=500, detail="영수증 인식에 실패했습니다.")