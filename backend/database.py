# Supabase 클라이언트 설정 파일
# 모든 API에서 이 파일을 import해서 DB 연결해요

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 환경변수에서 Supabase 정보 가져오기
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Supabase 클라이언트 생성
# 앱 전체에서 이 supabase 객체를 사용해요
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)