// 저축 입금 내역 모달
// 목표 카드의 💰 버튼을 누르면 열림
// 입금 내역 리스트(날짜순) + 새 입금 추가 기능 제공

import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { getDeposits, addDeposit, deleteDeposit } from '../../lib/api';

// 입금 내역 타입
type Deposit = {
  id: string;
  goal_id: string;
  amount: number;
  note: string;
  date: string;
};

interface GoalDepositModalProps {
  visible: boolean;
  goalId: string;           // 어떤 목표의 입금 내역인지
  goalTitle: string;        // 모달 헤더에 목표 이름 표시용
  onClose: () => void;
  onUpdated: () => void;    // 입금/삭제 후 목표 목록 새로고침
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

export default function GoalDepositModal({
  visible, goalId, goalTitle, onClose, onUpdated
}: GoalDepositModalProps) {

  // 입금 내역 목록
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);

  // 새 입금 입력값
  const [newAmount, setNewAmount] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newDate, setNewDate] = useState(() => {
    // 기본값: 오늘 날짜 (YYYY-MM-DD)
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [adding, setAdding] = useState(false);

  // 모달 열릴 때마다 입금 내역 불러오기
  useEffect(() => {
    if (visible && goalId) fetchDeposits();
  }, [visible, goalId]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const data = await getDeposits(goalId);
      setDeposits(data);
    } catch (e) {
      console.error('입금 내역 불러오기 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  // 입금 추가
  const handleAdd = async () => {
    if (!newAmount) {
      Alert.alert('알림', '금액을 입력해주세요.');
      return;
    }
    setAdding(true);
    try {
      await addDeposit(goalId, {
        amount: parseInt(newAmount),
        note: newNote || undefined,
        date: newDate,
      });
      // 입력값 초기화
      setNewAmount('');
      setNewNote('');
      // 내역 새로고침 + 목표 카드 달성률 갱신
      await fetchDeposits();
      onUpdated();
    } catch (e) {
      Alert.alert('오류', '입금 추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  // 입금 내역 삭제
  const handleDelete = async (depositId: string) => {
    try {
      await deleteDeposit(goalId, depositId);
      await fetchDeposits();
      onUpdated(); // 목표 카드 달성률 갱신
    } catch (e) {
      Alert.alert('오류', '삭제에 실패했습니다.');
    }
  };

  // 전체 입금 합계
  const total = deposits.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.box}>

          {/* 헤더 */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>저축 내역</Text>
              <Text style={styles.subtitle}>{goalTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textDark} />
            </TouchableOpacity>
          </View>

          {/* 총 입금 합계 */}
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>총 저축 금액</Text>
            <Text style={styles.totalAmount}>₩{formatAmount(total)}</Text>
          </View>

          {/* 입금 내역 리스트 (날짜 역순) */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
            ) : deposits.length === 0 ? (
              <Text style={styles.emptyText}>아직 입금 내역이 없어요</Text>
            ) : (
              deposits.map(deposit => (
                <View key={deposit.id} style={styles.depositRow}>
                  <View style={styles.depositLeft}>
                    {/* 날짜 */}
                    <Text style={styles.depositDate}>{deposit.date}</Text>
                    {/* 메모 (있을 때만) */}
                    {deposit.note ? (
                      <Text style={styles.depositNote}>{deposit.note}</Text>
                    ) : null}
                  </View>
                  <View style={styles.depositRight}>
                    <Text style={styles.depositAmount}>+₩{formatAmount(deposit.amount)}</Text>
                    {/* 삭제 버튼 */}
                    <TouchableOpacity onPress={() => handleDelete(deposit.id)}>
                      <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* 새 입금 추가 영역 */}
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>입금 추가</Text>

            {/* 금액 입력 */}
            <View style={styles.amountRow}>
              <Text style={styles.amountPrefix}>₩</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="금액"
                placeholderTextColor={Colors.textHint}
                value={newAmount}
                onChangeText={setNewAmount}
                keyboardType="numeric"
              />
            </View>

            {/* 메모 입력 */}
            <TextInput
              style={styles.noteInput}
              placeholder="메모 (선택)"
              placeholderTextColor={Colors.textHint}
              value={newNote}
              onChangeText={setNewNote}
            />

            {/* 날짜 입력 */}
            {Platform.OS === 'web' ? (
              // 웹: input type=date
              // @ts-ignore
              <input
                type="date"
                value={newDate}
                onChange={(e: any) => setNewDate(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px',
                  border: `1px solid ${Colors.border}`, fontSize: '14px',
                  color: Colors.textDark, backgroundColor: Colors.bgMain,
                  outline: 'none', boxSizing: 'border-box', marginBottom: '8px',
                }}
              />
            ) : (
              // 앱: 텍스트 직접 입력 (YYYY-MM-DD)
              <TextInput
                style={styles.noteInput}
                placeholder="날짜 (YYYY-MM-DD)"
                placeholderTextColor={Colors.textHint}
                value={newDate}
                onChangeText={setNewDate}
              />
            )}

            {/* 추가 버튼 */}
            <TouchableOpacity
              style={[styles.addBtn, adding && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={adding}
            >
              {adding
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={styles.addBtnText}>추가</Text>
              }
            </TouchableOpacity>
          </View>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: Colors.textDark,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.primary,
    fontSize: 13,
    marginTop: 2,
  },
  // 총 합계 박스
  totalBox: {
    backgroundColor: Colors.bgMain,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalLabel: {
    color: '#437CA1',
    fontSize: 13,
  },
  totalAmount: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 내역 리스트
  list: {
    maxHeight: 200,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.textHint,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  depositLeft: {
    flex: 1,
    gap: 2,
  },
  depositDate: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  depositNote: {
    color: Colors.textHint,
    fontSize: 12,
  },
  depositRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  depositAmount: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // 입금 추가 영역
  addSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
    gap: 8,
  },
  addTitle: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMain,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  amountPrefix: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: 'bold',
  },
  amountInput: {
    flex: 1,
    color: Colors.textDark,
    fontSize: 15,
  },
  noteInput: {
    backgroundColor: Colors.bgMain,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textDark,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});
