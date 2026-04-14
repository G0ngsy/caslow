# 엑셀/CSV 파일 가져오기 API 라우터
# 은행 거래내역 파일을 파싱해서 지출 자동 입력

from fastapi import APIRouter, Header, HTTPException, UploadFile, File
from database import supabase, get_supabase_with_token
from groq import Groq
import os
import json
import pandas as pd
import io
from datetime import date
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/excel", tags=["excel"])

# Groq 클라이언트 초기화
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_user_id(authorization: str) -> str:
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        return user.user.id
    except:
        raise HTTPException(status_code=401, detail="인증이 필요합니다.")

# ✅ 엑셀/CSV 파일 파싱 (POST /excel/upload)
@router.post("/upload")
async def upload_excel(
    file: UploadFile = File(...),
    authorization: str = Header(...)
):
    """은행 거래내역 엑셀/CSV 파일 파싱 후 지출 자동 입력"""
    user_id = get_user_id(authorization)
    token = authorization.replace("Bearer ", "")
    authed_supabase = get_supabase_with_token(token)

    # 파일 읽기
    contents = await file.read()

    try:
        # 파일 형식에 따라 파싱
        if file.filename.endswith('.csv'):
            # CSV 파일 - 여러 인코딩 시도
            for encoding in ['utf-8', 'cp949', 'euc-kr']:
                try:
                    df = pd.read_csv(io.BytesIO(contents), encoding=encoding)
                    break
                except:
                    continue
        else:
            # 엑셀 파일
            df = pd.read_excel(io.BytesIO(contents))

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"파일 파싱 실패: {str(e)}")

    # 데이터 미리보기 텍스트로 변환
    preview = df.head(20).to_string()

    # Groq로 컬럼 분석 및 데이터 추출
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": """당신은 은행 거래내역 파일 분석 전문가입니다.
반드시 한국어로 답변하고 JSON만 출력하세요.
다른 텍스트는 절대 포함하지 마세요."""
            },
            {
                "role": "user",
                "content": f"""다음 은행 거래내역 데이터를 분석해서
출금 내역만 추출하고 아래 JSON 형식으로 반환해주세요.

데이터:
{preview}

반환 형식:
{{
  "expenses": [
    {{
      "title": "가맹점명 또는 내용",
      "amount": 숫자만 (출금액),
      "date": "YYYY-MM-DD",
      "category": "카페/음식/교통/쇼핑/구독/기타 중 하나"
    }}
  ]
}}

주의사항:
- 입금 내역은 제외
- 금액은 숫자만 (쉼표, 원 제외)
- 날짜는 YYYY-MM-DD 형식으로 변환
- 카테고리는 내용 보고 자동 분류"""
            }
        ],
        max_tokens=2000,
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    # 응답 파싱
    try:
        result = json.loads(response.choices[0].message.content)
        expenses = result.get("expenses", [])
    except:
        raise HTTPException(status_code=500, detail="데이터 분석에 실패했습니다.")

    # Supabase에 일괄 저장
    saved_count = 0
    today = str(date.today())

    for expense in expenses:
        try:
            # 미래 날짜 제외
            if expense.get("date", "") > today:
                continue

            authed_supabase.table("expenses").insert({
                "user_id": user_id,
                "title": expense.get("title", ""),
                "amount": int(expense.get("amount", 0)),
                "category": expense.get("category", "기타"),
                "date": expense.get("date", today),
                "memo": "[엑셀 가져오기]",
            }).execute()
            saved_count += 1
        except Exception as e:
            print(f"저장 실패: {e}")
            continue

    return {
        "success": True,
        "total": len(expenses),
        "saved": saved_count,
        "message": f"{saved_count}건의 지출이 저장되었습니다."
    }