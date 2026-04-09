import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import BudgetModal from './BudgetModal';
import RecurringModal, { RecurringItem } from './RecurringModal';
import CategoryEditModal, { Category } from './CategoryEditModal';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', icon: '☕', label: '카페',  color: '#FFF3E0', textColor: '#E65100' },
  { id: '2', icon: '🍽', label: '음식',  color: '#FFF8E1', textColor: '#F57F17' },
  { id: '3', icon: '🚌', label: '교통',  color: '#E8EAF6', textColor: '#283593' },
  { id: '4', icon: '🛍', label: '쇼핑',  color: '#FCE4EC', textColor: '#880E4F' },
  { id: '5', icon: '📋', label: '구독',  color: '#E8F5E9', textColor: '#1B5E20' },
  { id: '6', icon: '···', label: '기타', color: '#F3E5F5', textColor: '#4A148C' },
];

const CATEGORY_ICONS: Record<string, string> = {
  카페: '☕', 음식: '🍽', 교통: '🚌', 쇼핑: '🛍', 구독: '📋', 기타: '···',
};

export default function SettingScreen() {
  const [budget, setBudget] = useState(500000);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [recurringItems, setRecurringItems] = useState<RecurringItem[]>([]);

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm('정말 로그아웃 하시겠습니까?');
    if (confirmed) {
      const { error } = await supabase.auth.signOut();
      if (error) window.alert('오류: ' + error.message);
    }
  };

  const handleAddRecurring = (item: RecurringItem) => {
    setRecurringItems((prev) => [...prev, item]);
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <View style={styles.container}>
      <Header title="설정" />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 월 예산 설정 */}
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

        {/* 카테고리 */}
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
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <View key={cat.id} style={[styles.categoryChip, { backgroundColor: cat.color }]}>
                <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                <Text style={[styles.categoryChipText, { color: cat.textColor }]}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 정기 지출 */}
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

          {recurringItems.length === 0 ? (
            <Text style={styles.emptyText}>등록된 정기 지출이 없어요</Text>
          ) : (
            recurringItems.map((item) => (
              <View key={item.id} style={styles.recurringItem}>
                <View style={[styles.iconBox, { backgroundColor: '#EDE7F6' }]}>
                  <Text style={{ fontSize: 16 }}>{CATEGORY_ICONS[item.category] ?? '···'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSubText}>매월 {item.day}일</Text>
                </View>
                <Text style={styles.cardTitle}>₩{item.amount.toLocaleString()}</Text>
                <TouchableOpacity onPress={() => handleDeleteRecurring(item.id)} style={{ paddingLeft: 8 }}>
                  <Ionicons name="trash-outline" size={18} color="#BBBBBB" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* 로그아웃 */}
        <TouchableOpacity style={styles.logoutCard} onPress={handleLogout}>
          <View style={styles.logoutIconBox}>
            <Ionicons name="log-out-outline" size={20} color="#E53935" />
          </View>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

      </ScrollView>

      <BudgetModal
        visible={budgetModalVisible}
        currentBudget={budget}
        onSave={setBudget}
        onClose={() => setBudgetModalVisible(false)}
      />

      <RecurringModal
        visible={recurringModalVisible}
        categories={categories}
        onAdd={handleAddRecurring}
        onClose={() => setRecurringModalVisible(false)}
      />

      <CategoryEditModal
        visible={categoryModalVisible}
        categories={categories}
        onSave={setCategories}
        onClose={() => setCategoryModalVisible(false)}
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
