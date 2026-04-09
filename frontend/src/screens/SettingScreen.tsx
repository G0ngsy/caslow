import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import BudgetModal from './modals/BudgetModal';
import RecurringModal from './modals/RecurringModal';
import CategoryEditModal from './modals/CategoryEditModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import LogoutConfirmModal from './modals/LogoutConfirmModal';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import {
  getCategories, createCategory, deleteCategory,deleteExpensesByMemo,
  getRecurringExpenses, createRecurringExpense, deleteRecurringExpense,createExpense
} from '../lib/api';

// 카테고리 이름 → 아이콘 자동 매핑
const ICON_MAP: { keywords: string[]; icon: string }[] = [
  { keywords: ['카페', '커피'], icon: '☕' },
  { keywords: ['음식', '식비', '밥', '식사'], icon: '🍽️' },
  { keywords: ['교통', '버스', '지하철', '택시'], icon: '🚌' },
  { keywords: ['쇼핑', '옷'], icon: '🛍️' },
  { keywords: ['구독', '넷플릭스'], icon: '📋' },
  { keywords: ['병원', '의료', '약'], icon: '🏥' },
  { keywords: ['운동', '헬스'], icon: '🏋️' },
  { keywords: ['여행', '숙박'], icon: '✈️' },
  { keywords: ['교육', '학원', '책'], icon: '📚' },
  { keywords: ['기타'], icon: '···' },
];

// 카테고리 이름으로 아이콘 반환
function getIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const entry of ICON_MAP) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.icon;
  }
  return '🏷️';
}

export default function SettingScreen() {
  // 월 예산 상태
  const [budget, setBudget] = useState(500000);
  // 카테고리 목록 상태
  const [categories, setCategories] = useState<any[]>([]);
  // 정기 지출 목록 상태
  const [recurringItems, setRecurringItems] = useState<any[]>([]);

  // 모달 표시 여부
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 삭제할 정기 지출 ID (null이면 모달 닫힘)
  const [deleteRecurringId, setDeleteRecurringId] = useState<string | null>(null);

  // 화면 포커스될 때마다 데이터 새로 불러오기
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      fetchRecurring();
    }, [])
  );

  // 카테고리 목록 불러오기
  // 카테고리가 없으면 기본 6개 자동 생성
  const fetchCategories = async () => {
    try {
      const data = await getCategories();
      if (data.length === 0) {
        const defaults = [
          { name: '카페',  color: '#A78BFA' },
          { name: '음식',  color: '#F59E0B' },
          { name: '교통',  color: '#3B82F6' },
          { name: '쇼핑',  color: '#EC4899' },
          { name: '구독',  color: '#10B981' },
          { name: '기타',  color: '#6B7280' },
        ];
        await Promise.all(defaults.map(d => createCategory(d)));
        const seeded = await getCategories();
        setCategories(seeded);
      } else {
        setCategories(data);
      }
    } catch (error) {
      console.error('카테고리 불러오기 실패:', error);
    }
  };

  // 정기 지출 목록 불러오기
  const fetchRecurring = async () => {
    try {
      const data = await getRecurringExpenses();
      setRecurringItems(data);
    } catch (error) {
      console.error('정기 지출 불러오기 실패:', error);
    }
  };

  // 정기 지출 추가
  const handleAddRecurring = async (item: {
    name: string;
    amount: number;
    day: number;
    category: string;
  }) => {
    try {
      // 1. recurring_expenses 테이블에 정기 지출 등록
    await createRecurringExpense({
      title: item.name,
      amount: item.amount,
      day_of_month: item.day,
      category: item.category,
    });

    // 2. 이번 달 결제일 기준으로 expenses 테이블에 추가
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(item.day).padStart(2, '0');

    // 한국 시간 기준 날짜 직접 계산 (toISOString은 UTC라 날짜 틀릴 수 있음)
    const dateStr = `${year}-${month}-${day}`;

    await createExpense({
      amount: item.amount,
      category: item.category,
      memo: `[정기] ${item.name}`,
      date: dateStr,
    });

    fetchRecurring();
  } catch (error) {
    console.error('정기 지출 추가 실패:', error);
    window.alert('정기 지출 추가에 실패했습니다.');
  }
};

  // 정기 지출 삭제 확인
  const handleConfirmDeleteRecurring = async () => {
  if (!deleteRecurringId) return;
  try {
    // 삭제할 정기 지출 찾기
    const item = recurringItems.find(i => i.id === deleteRecurringId);
    
    // 1. recurring_expenses 테이블에서 삭제
    await deleteRecurringExpense(deleteRecurringId);
    
    // 2. expenses 테이블에서도 관련 지출 삭제
    if (item) {
      await deleteExpensesByMemo(`[정기] ${item.title}`);
    }
    
    fetchRecurring();
    setDeleteRecurringId(null);
  } catch (error) {
    console.error('정기 지출 삭제 실패:', error);
    window.alert('삭제에 실패했습니다.');
  }
};

  // 카테고리 추가
  const handleAddCategory = async (name: string, color: string) => {
    try {
      await createCategory({ name, color });
      fetchCategories();
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
    }
  };

  // 카테고리 삭제
  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) window.alert('오류: ' + error.message);
    setLogoutModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Header title="설정" />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 월 예산 설정 카드 */}
        <TouchableOpacity style={styles.card} onPress={() => setBudgetModalVisible(true)}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EDE7F6' }]}>
              <Ionicons name="wallet-outline" size={20} color="#7C4DFF" />
            </View>
            <View>
              <Text style={styles.cardTitle}>월 예산 설정</Text>
              <Text style={styles.cardSubText}>₩{budget.toLocaleString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CCCCCC" style={{ marginLeft: 'auto' as any }} />
          </View>
        </TouchableOpacity>

        {/* 카테고리 관리 카드 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBox, { backgroundColor: '#FFF3CD' }]}>
                <Ionicons name="pricetags-outline" size={20} color="#E6A817" />
              </View>
              <Text style={styles.sectionTitle}>카테고리 관리</Text>
            </View>
            <TouchableOpacity onPress={() => setCategoryModalVisible(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>편집</Text>
            </TouchableOpacity>
          </View>
          {/* 카테고리 칩 목록 */}
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <View key={cat.id} style={[styles.categoryChip, { backgroundColor: cat.color + '33' }]}>
                <Text style={{ fontSize: 16 }}>{getIcon(cat.name)}</Text>
                <Text style={[styles.categoryChipText, { color: cat.color }]}>{cat.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 정기 지출 카드 */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBox, { backgroundColor: '#D6F5E3' }]}>
                <Ionicons name="repeat-outline" size={20} color="#27AE60" />
              </View>
              <Text style={styles.sectionTitle}>정기 지출</Text>
            </View>
            <TouchableOpacity onPress={() => setRecurringModalVisible(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>+ 추가</Text>
            </TouchableOpacity>
          </View>

          {/* 정기 지출 목록 */}
          {recurringItems.length === 0 ? (
            <Text style={styles.emptyText}>등록된 정기 지출이 없어요</Text>
          ) : (
            recurringItems.map((item) => (
              <View key={item.id} style={styles.recurringItem}>
                <View style={[styles.iconBox, { backgroundColor: '#EDE7F6' }]}>
                  <Text style={{ fontSize: 16 }}>{getIcon(item.category)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubText}>매월 {item.day_of_month}일</Text>
                </View>
                <Text style={styles.cardTitle}>₩{item.amount.toLocaleString()}</Text>
                {/* 삭제 버튼 → DeleteConfirmModal 오픈 */}
                <TouchableOpacity onPress={() => setDeleteRecurringId(item.id)} style={{ paddingLeft: 8 }}>
                  <Ionicons name="trash-outline" size={18} color="#BBBBBB" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutCard} onPress={() => setLogoutModalVisible(true)}>
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={20} color="#E53935" />
          </View>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* 월 예산 설정 모달 */}
      <BudgetModal
        visible={budgetModalVisible}
        currentBudget={budget}
        onSave={setBudget}
        onClose={() => setBudgetModalVisible(false)}
      />

      {/* 정기 지출 등록 모달 */}
      <RecurringModal
        visible={recurringModalVisible}
        categories={categories}
        onAdd={handleAddRecurring}
        onClose={() => setRecurringModalVisible(false)}
      />

      {/* 카테고리 편집 모달 */}
      <CategoryEditModal
        visible={categoryModalVisible}
        categories={categories}
        onAdd={handleAddCategory}
        onDelete={handleDeleteCategory}
        onClose={() => setCategoryModalVisible(false)}
      />

      {/* 정기 지출 삭제 확인 모달 */}
      <DeleteConfirmModal
        visible={deleteRecurringId !== null}
        message="정기 지출을 삭제하시겠습니까?"
        onConfirm={handleConfirmDeleteRecurring}
        onCancel={() => setDeleteRecurringId(null)}
      />

      {/* 로그아웃 확인 모달 */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F8',
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1E3E',
  },
  cardSubText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 'auto' as any,
    fontSize: 20,
    color: '#BBBBBB',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B1E3E',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F0F0F5',
  },
  editBtnText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#BBBBBB',
    fontSize: 13,
    paddingVertical: 16,
  },
  recurringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  logoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#E53935',
  },
});
