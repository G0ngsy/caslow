import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import GoalEditModal, { Goal, GOAL_TYPES } from './modals/GoalEditModal';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { getGoals, createGoal, deleteGoal, updateGoal, getGoalAdvice } from '../lib/api';


// 달성률에 따른 프로그레스 바 색상
function getProgressColor(percent: number): string {
  if (percent < 34) return '#6E6E6D';   //  (0~33%)
  if (percent < 67) return '#E3C170';   //  (34~66%)
  return '#DE525E';                      //  (67~100%)
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

function getAiAdvice(goal: Goal, percent: number): string {
  const typeAdvice: Record<string, string> = {
    '저축': '매달 정기 저축액을 설정하고 자동이체를 활용하면 효과적입니다.',
    '투자': '분산 투자로 리스크를 줄이고, 장기적 관점으로 접근하세요.',
    '비상금': '생활비 3~6개월치를 목표로 하는 것이 좋습니다.',
    '여행': '항공·숙박·식비로 나눠 세부 계획을 세우면 절약에 도움이 됩니다.',
    '교육': '교육비 지원 제도나 할인 프로그램을 먼저 알아보세요.',
    '기타': '목표를 작은 단계로 나눠 꾸준히 진행하세요.',
  };

  let progressMsg = '';
  if (percent < 25) progressMsg = '이제 막 시작했네요! 작은 금액이라도 꾸준히 모으는 게 중요해요.';
  else if (percent < 50) progressMsg = `${percent}% 달성! 좋은 출발이에요. 지금 페이스를 유지하세요.`;
  else if (percent < 75) progressMsg = `절반 이상 달성했어요! 조금만 더 힘내세요.`;
  else if (percent < 100) progressMsg = `거의 다 왔어요! ${100 - percent}%만 더 채우면 목표 달성입니다.`;
  else progressMsg = '목표를 달성했어요! 새로운 목표를 설정해보세요.';

  const specific = typeAdvice[goal.type] ?? typeAdvice['기타'];
  return `${progressMsg}\n\n${specific}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  // 목표 없을 때 빈 화면
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    color: '#437CA1',
    fontSize: 15,
  },
  emptySubText: {
    color: Colors.border,
    fontSize: 13,
  },
  // 목표 카드
  goalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 6,
    shadowColor: '#1A3A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  goalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  goalTitle: {
    color: Colors.textDark,
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bgMain,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#D2EEFA',
  },
  goalTypeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  goalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalCurrentAmount: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  goalTargetAmount: {
    color: '#437CA1',
    fontSize: 15,
  },
  // 프로그레스 바
  progressBar: {
    height: 8,
    backgroundColor: '#D2EEFA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalPercent: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  goalDeadline: {
    color: '#ABCCEA',
    fontSize: 12,
  },
  // AI 조언 박스
  aiAdviceBox: {
    marginTop: 14,
    backgroundColor: Colors.bgMain,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  aiAdviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiAdviceTitle: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  aiAdviceText: {
    color: Colors.textDark,
    fontSize: 13,
    lineHeight: 20,
  },
  // + 버튼
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // 새 목표 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 24,
    gap: 12,
    width: '100%',
  },
  modalTitle: {
    color: Colors.textDark,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.bgMain,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textDark,
    fontSize: 15,
  },
  modalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMain,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  modalAmountPrefix: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalAmountInput: {
    flex: 1,
    color: Colors.textDark,
    fontSize: 15,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeText: {
    color: '#437CA1',
    fontSize: 13,
  },
  typeTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  modalSaveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgMain,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgMain,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    color: Colors.textDark,
    fontSize: 15,
  },
});

export default function GoalScreen() {
  // 목표 목록 상태
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedType, setSelectedType] = useState('저축');
  const [deadline, setDeadline] = useState('');
  // 수정 중인 목표
  const [editingGoal, setEditingGoal] = useState<any>(null);
  // 확장된 목표 ID (AI 조언 표시)
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 삭제 확인 모달
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  // AI 조언 상태 (goal id → 조언 텍스트)
  const [aiAdvices, setAiAdvices] = useState<Record<string, string>>({});
  const [loadingAdvices, setLoadingAdvices] = useState<Record<string, boolean>>({});

  // 목표 카드 클릭 시 확장 + AI 조언 불러오기
const toggleExpand = async (id: string) => {
  setExpandedId(prev => prev === id ? null : id);

  // 이미 조언이 있으면 다시 불러오지 않음
  if (aiAdvices[id]) return;

  // AI 조언 불러오기
  setLoadingAdvices(prev => ({ ...prev, [id]: true }));
  try {
    const data = await getGoalAdvice(id);
    setAiAdvices(prev => ({ ...prev, [id]: data.advice }));
  } catch (error) {
    console.error('AI 조언 불러오기 실패:', error);
    setAiAdvices(prev => ({ ...prev, [id]: 'AI 조언을 불러오지 못했습니다.' }));
  } finally {
    setLoadingAdvices(prev => ({ ...prev, [id]: false }));
  }
};

  // 모달 닫기 + 초기화
  const handleCloseModal = () => {
    setShowModal(false);
    setTitle('');
    setAmount('');
    setDeadline('');
    setSelectedType('저축');
  };

  // 목표 수정 저장
const handleSaveEdit = async (updatedGoal: any) => {
  try {
    await updateGoal(updatedGoal.id, {
      title: updatedGoal.title,
      target_amount: updatedGoal.target_amount,
      current_amount: updatedGoal.current_amount,
      type: updatedGoal.type,
      deadline: updatedGoal.deadline,
    });
    fetchGoals();
    setEditingGoal(null);
  } catch (error) {
    console.error('목표 수정 실패:', error);
    Alert.alert('알림','수정에 실패했습니다.');
  }
};

  // 화면 포커스될 때마다 목표 목록 불러오기
  useFocusEffect(
    useCallback(() => {
      fetchGoals();
    }, [])
  );

  // 목표 목록 불러오기
  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await getGoals();
      setGoals(data);
    } catch (error) {
      console.error('목표 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 목표 추가
  const handleAddGoal = async () => {
    if (!title || !amount) {
      Alert.alert('알림','이름과 금액을 입력해주세요.');
      return;
    }
    try {
      await createGoal({
        title,
        target_amount: parseInt(amount),
        type: selectedType,
        deadline: deadline || '',
      });
      handleCloseModal();
      fetchGoals();
    } catch (error) {
      console.error('목표 추가 실패:', error);
      Alert.alert('알림','목표 추가에 실패했습니다.');
    }
  };

  // 목표 삭제 확인
  const handleDeleteGoal = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteGoal(deleteTargetId);
      fetchGoals();
    } catch (error) {
      console.error('목표 삭제 실패:', error);
      Alert.alert('알림','삭제에 실패했습니다.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  

  return (
    <View style={styles.container}>
      <Header title="목표" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
      >
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="flag-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyText}>아직 설정한 목표가 없어요</Text>
            <Text style={styles.emptySubText}>+ 버튼을 눌러 목표를 만들어보세요</Text>
          </View>
        ) : (
          goals.map(goal => {
            const percent = Math.round((goal.current_amount / goal.target_amount) * 100);
            const isExpanded = expandedId === goal.id;

            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => toggleExpand(goal.id)}
                activeOpacity={0.85}
              >
                {/* 헤더 */}
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleRow}>
                    <View style={[styles.goalDot, { backgroundColor: goal.color || Colors.primary }]} />
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                  </View>
                  <View style={styles.goalHeaderRight}>
                    {/* 수정 버튼 */}
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => setEditingGoal(goal)}
                    >
                      <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                    </TouchableOpacity>

                    {/* 삭제 버튼 */}
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleDeleteGoal(goal.id)}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    </TouchableOpacity>

                    {/* 타입 뱃지 */}
                    <View style={styles.goalTypeBadge}>
                      <Text style={styles.goalTypeText}>{goal.type}</Text>
                    </View>
                  </View>
                </View>

                {/* 금액 */}
                  <View style={styles.goalAmountRow}>
                    <Text style={styles.goalCurrentAmount}>₩{formatAmount(goal.current_amount)}</Text>
                    <Text style={styles.goalTargetAmount}>₩{formatAmount(goal.target_amount)}</Text>
                  </View>

                  {/* 프로그레스 바 */}
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, {
                      width: `${Math.min(percent, 100)}%`,
                      backgroundColor: getProgressColor(percent),  // 색상 함수 적용
                    }]} />
                  </View>

                  {/* 푸터 */}
                  <View style={styles.goalFooter}>
                    <Text style={[styles.goalPercent, { color: getProgressColor(percent) }]}>
                      달성률 {percent}%
                    </Text>
                    <Text style={styles.goalDeadline}>기한: {goal.deadline}</Text>
                  </View>

                {/* AI 조언 (확장 시) */}
                {isExpanded && (
                  <View style={styles.aiAdviceBox}>
                    <View style={styles.aiAdviceHeader}>
                      <Ionicons name="sparkles" size={13} color={Colors.primary} />
                      <Text style={styles.aiAdviceTitle}>AI 조언</Text>
                    </View>
                    {loadingAdvices[goal.id] ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.aiAdviceText}>AI가 조언을 생성 중이에요...</Text>
                      </View>
                    ) : (
                      <Text style={styles.aiAdviceText}>{aiAdvices[goal.id] || ''}</Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* + 추가 버튼 */}
      <TouchableOpacity style={[styles.addButton, { bottom: 20 }]} onPress={() => setShowModal(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* 새 목표 모달 */}
      <Modal visible={showModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={handleCloseModal}>
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            {/* 헤더 */}
            <View style={styles.goalHeader}>
              <Text style={styles.modalTitle}>새 목표 만들기</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal}>
                <Ionicons name="close" size={18} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* 목표 이름 */}
            <TextInput
              style={styles.modalInput}
              placeholder="목표 이름"
              placeholderTextColor={Colors.textHint}
              value={title}
              onChangeText={setTitle}
            />

            {/* 목표 금액 */}
            <View style={styles.modalAmountRow}>
              <Text style={styles.modalAmountPrefix}>₩</Text>
              <TextInput
                style={styles.modalAmountInput}
                placeholder="목표 금액"
                placeholderTextColor={Colors.textHint}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>

            {/* 타입 선택 */}
            <View style={styles.typeRow}>
              {GOAL_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeButton, selectedType === type && styles.typeButtonActive]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.typeText, selectedType === type && styles.typeTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 기한 */}
            {Platform.OS === 'web' ? (
              // @ts-ignore
              <input
                type="date"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: `1px solid ${Colors.border}`,
                  fontSize: '15px',
                  color: deadline ? Colors.textDark : Colors.textHint,
                  backgroundColor: Colors.bgMain,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                value={deadline}
                onChange={(e: any) => setDeadline(e.target.value)}
              />
            ) : (
              <>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={[styles.dateText, !deadline && { color: Colors.textHint }]}>
                    {deadline || '기한 선택'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={deadline ? new Date(deadline) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(_, selected) => {
                      setShowDatePicker(false);
                      if (selected) {
                        setDeadline(selected.toISOString().split('T')[0]);
                      }
                    }}
                  />
                )}
              </>
            )}

            {/* 저장 버튼 */}
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddGoal}>
              <Text style={styles.modalSaveBtnText}>목표 생성</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 목표 수정 모달 */}
      <GoalEditModal
        visible={editingGoal !== null}
        goal={editingGoal}
        onSave={handleSaveEdit}
        onClose={() => setEditingGoal(null)}
      />

      {/* 목표 삭제 확인 모달 */}
      <DeleteConfirmModal
        visible={deleteTargetId !== null}
        message="목표를 삭제하시겠습니까?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </View>
  );
}
