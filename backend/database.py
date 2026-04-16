# Supabase 클라이언트 설정 파일
# 모든 API에서 이 파일을 import해서 DB 연결해요

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 기본 클라이언트 (anon key)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_with_token(token: str) -> Client:
    """
    유저 토큰으로 인증된 Supabase 클라이언트 반환
    RLS 정책을 통과하기 위해 유저 토큰 필요
    """
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    client.auth.set_session(token, token)
    return client

# 서비스 키로 관리자 권한 클라이언트
supabase_admin = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)