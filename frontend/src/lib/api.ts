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

// 이번 달 카테고리별 지출 합계 조회
export async function getExpensesByCategory() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/analysis/category`, { headers });
  if (!response.ok) throw new Error('카테고리별 지출을 불러오지 못했습니다.');
  return response.json();
}

// 월별 지출 합계 조회
export async function getExpensesByMonth() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/analysis/monthly`, { headers });
  if (!response.ok) throw new Error('월별 지출을 불러오지 못했습니다.');
  return response.json();
}

// 목표 목록 조회
export async function getGoals() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/goals/`, { headers });
  if (!response.ok) throw new Error('목표를 불러오지 못했습니다.');
  return response.json();
}

// 목표 추가
export async function createGoal(data: {
  title: string;
  target_amount: number;
  type: string;
  deadline: string;
}) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/goals/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('목표 추가에 실패했습니다.');
  return response.json();
}

// 목표 삭제
export async function deleteGoal(id: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/goals/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('목표 삭제에 실패했습니다.');
  return response.json();
}

// 목표 수정
export async function updateGoal(id: string, data: {
  title?: string;
  target_amount?: number;
  current_amount?: number;
  type?: string;
  deadline?: string;
}) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/goals/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('목표 수정에 실패했습니다.');
  return response.json();
}


// 카테고리 목록 조회
export async function getCategories() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/categories/`, { headers });
  if (!response.ok) throw new Error('카테고리를 불러오지 못했습니다.');
  return response.json();
}

// 카테고리 추가
export async function createCategory(data: {
  name: string;
  color?: string;
}) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/categories/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('카테고리 추가에 실패했습니다.');
  return response.json();
}

// 카테고리 삭제
export async function deleteCategory(id: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('카테고리 삭제에 실패했습니다.');
  return response.json();
}


// 정기 지출 목록 조회
export async function getRecurringExpenses() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/recurring/`, { headers });
  if (!response.ok) throw new Error('정기 지출을 불러오지 못했습니다.');
  return response.json();
}

// 정기 지출 추가
export async function createRecurringExpense(data: {
  title: string;
  amount: number;
  day_of_month: number;
  category: string;
}) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/recurring/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('정기 지출 추가에 실패했습니다.');
  return response.json();
}

// 정기 지출 삭제
export async function deleteRecurringExpense(id: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/recurring/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('정기 지출 삭제에 실패했습니다.');
  return response.json();
}