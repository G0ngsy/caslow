import { supabase } from './supabase';

// 백엔드 서버 URL
// 배포된 Render 서버 URL로 변경
const BASE_URL = 'https://caslow.onrender.com';

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
  title: string;
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
  title?: string; 
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
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('지출 수정 실패 상세:', response.status, errorBody);
    throw new Error('지출 수정에 실패했습니다.');
  }
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

// 카테고리별 지출 합계 조회 (탭 필터 포함)
export async function getExpensesByCategory(tab: 'all' | 'fixed' | 'variable' = 'all') {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/analysis/category?tab=${tab}`, { headers });
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

// 정기 지출 관련 expenses 삭제 (메모에 [정기] 포함된 것)
export async function deleteExpensesByMemo(memo: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/expenses/by-memo?memo=${encodeURIComponent(memo)}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('지출 삭제에 실패했습니다.');
  return response.json();
}

// 정기 지출 제목으로 recurring_expenses 삭제
export async function deleteRecurringByTitle(title: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/recurring/by-title?title=${encodeURIComponent(title)}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('정기 지출 삭제에 실패했습니다.');
  return response.json();
}

// 월 예산 조회
export async function getBudget() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/budget/`, { headers });
  if (!response.ok) throw new Error('예산을 불러오지 못했습니다.');
  return response.json();
}

// 월 예산 저장
export async function saveBudget(amount: number) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/budget/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) throw new Error('예산 저장에 실패했습니다.');
  return response.json();
}

// AI 채팅 메시지 전송
export async function sendChatMessage(messages: { role: string; content: string }[]) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/chat/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ messages }),
  });
  if (!response.ok) throw new Error('AI 응답을 받지 못했습니다.');
  return response.json();
}

// 분석 화면 AI 인사이트 조회
export async function getAiInsight() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/chat/insight`, { headers });
  if (!response.ok) throw new Error('AI 인사이트를 불러오지 못했습니다.');
  return response.json();
}


// 목표 AI 조언 조회
export async function getGoalAdvice(goalId: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/chat/goal-advice/${goalId}`, { headers });
  if (!response.ok) throw new Error('AI 조언을 불러오지 못했습니다.');
  return response.json();
}

// OCR 영수증 인식
export async function recognizeReceipt(imageBase64: string, mimeType: string = 'image/jpeg') {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/ocr/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      image_base64: imageBase64,
      mime_type: mimeType,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error('OCR 오류 상세:', response.status, errorBody);
    throw new Error('영수증 인식에 실패했습니다.');
  }
  return response.json();
}

// 엑셀/CSV 파일 업로드 및 지출 자동 입력
export async function uploadExcel(file: File) {
  const headers = await getAuthHeader();
  // Content-Type은 FormData가 자동으로 설정하므로 제거
  delete (headers as any)['Content-Type'];

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${BASE_URL}/excel/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('엑셀 업로드 오류:', errorBody);
    throw new Error('파일 업로드에 실패했습니다.');
  }
  return response.json();
}

// 푸시 토큰 저장
export async function savePushToken(token: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/profiles/push-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ push_token: token }),
  });
  if (!response.ok) throw new Error('푸시 토큰 저장 실패');
  return response.json();
}

// 회원탈퇴
export async function withdrawAccount() {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/auth/withdraw`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('회원탈퇴에 실패했습니다.');
  return response.json();
}

// ── 저축 입금 내역 ──────────────────────────────────────────

// 특정 목표의 입금 내역 목록 조회 (날짜 역순)
export async function getDeposits(goalId: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/goals/${goalId}/deposits`, { headers });
  if (!response.ok) throw new Error('입금 내역을 불러오지 못했습니다.');
  return response.json();
}

// 입금 추가 → 서버에서 current_amount 자동 재계산 후 갱신된 목표 반환
export async function addDeposit(goalId: string, data: { amount: number; note?: string; date?: string }) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/goals/${goalId}/deposits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('입금 추가에 실패했습니다.');
  return response.json();
}

// 입금 내역 삭제 → 서버에서 current_amount 자동 재계산 후 갱신된 목표 반환
export async function deleteDeposit(goalId: string, depositId: string) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/goals/${goalId}/deposits/${depositId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error('입금 삭제에 실패했습니다.');
  return response.json();
}

// 이메일 알림 설정 조회
export async function getEmailAlert(): Promise<{ email_alert: boolean }> {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/profiles/email-alert`, { headers });
  if (!response.ok) throw new Error('이메일 알림 설정 조회 실패');
  return response.json();
}

// 이메일 알림 설정 변경
export async function updateEmailAlert(enabled: boolean) {
  const headers = await getAuthHeader();
  const response = await fetch(`${BASE_URL}/profiles/email-alert`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ email_alert: enabled }),
  });
  if (!response.ok) throw new Error('이메일 알림 설정 변경 실패');
  return response.json();
}
