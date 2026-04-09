import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { updateExpense, deleteExpense } from '../lib/api';
import DeleteConfirmModal from './modals/DeleteConfirmModal';

// 카테고리별 아이콘 및 색상
const categoryConfig: Record<string, { icon: string; color: string; label: string }> = {
  cafe:         { icon: 'cafe',                color: '#A78BFA', label: '카페' },
  food:         { icon: 'restaurant',          color: '#F59E0B', label: '음식' },
  transport:    { icon: 'bus',                 color: '#3B82F6', label: '교통' },
  shopping:     { icon: 'bag',                 color: '#EC4899', label: '쇼핑' },
  subscription: { icon: 'tv',                  color: '#10B981', label: '구독' },
  etc:          { icon: 'ellipsis-horizontal', color: '#6B7280', label: '기타' },
};

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  // 헤더
  header: {
    backgroundColor: Colors.bgHeader,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#255DAA',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  // 상세 카드
  detailCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    margin: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  amount: {
    color: Colors.danger,
    fontSize: 36,
    fontWeight: '900',
  },
  // 정보 행
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D2EEFA',
  },
  infoRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    color: '#437CA1',
    fontSize: 14,
  },
  infoValue: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: '600',
  },
  // 버튼
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    margin: 16,
    marginTop: 24,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  editButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default function ExpenseDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // 홈 화면에서 전달받은 지출 데이터
  const { expense } = route.params;
  const config = categoryConfig[expense.category] || { icon: 'card', color: '#6B7280', label: '기타' };

  // 삭제 함수
  const handleConfirmDelete = async () => {
    try {
      await deleteExpense(expense.id);
      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('삭제 실패:', error);
      window.alert('삭제에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지출 상세</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 상세 카드 */}
        <View style={styles.detailCard}>
          {/* 카테고리 아이콘 */}
          <View style={[styles.iconBox, { backgroundColor: config.color + '22' }]}>
            <Ionicons name={config.icon as any} size={36} color={config.color} />
          </View>
          <Text style={[styles.categoryLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.amount}>-₩{formatAmount(expense.amount)}</Text>
        </View>

        {/* 정보 목록 */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>날짜</Text>
            <Text style={styles.infoValue}>{expense.date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>카테고리</Text>
            <Text style={styles.infoValue}>{config.label}</Text>
          </View>
          <View style={styles.infoRowLast}>
            <Text style={styles.infoLabel}>메모</Text>
            <Text style={styles.infoValue}>{expense.memo || '없음'}</Text>
          </View>
        </View>

        {/* 수정 / 삭제 버튼 */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('ExpenseForm', { expense })}
          >
            <Ionicons name="pencil" size={16} color={Colors.white} />
            <Text style={styles.editButtonText}>수정</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={() => setDeleteModalVisible(true)}>
            <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            <Text style={styles.deleteButtonText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DeleteConfirmModal
        visible={deleteModalVisible}
        message="지출 내역을 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
}