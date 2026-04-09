import { supabase } from './supabase';

// 백엔드 서버 URL
// 나중에 Railway 배포 후 실제 URL로 변경
const BASE_URL = 'http://127.0.0.1:8000';

// Supabase 토큰 가져오는 함수
async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('로그인이 필요합니다.');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
}

// 지출 목록 조회
export async function getExpenses() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/`, { headers });
  if (!response.ok) throw new Error('지출 목록을 불러오지 못했습니다.');
  return response.json();
}

// 지출 추가
export async function createExpense(data: {
  amount: number;
  category: string;
  memo?: string;
  date: string;
}) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('지출 추가에 실패했습니다.');
  return response.json();
}

// 지출 수정
export async function updateExpense(id: string, data: {
  amount?: number;
  category?: string;
  memo?: string;
  date?: string;
}) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('지출 수정에 실패했습니다.');
  return response.json();
}

// 지출 삭제
export async function deleteExpense(id: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('지출 삭제에 실패했습니다.');
  return response.json();
}