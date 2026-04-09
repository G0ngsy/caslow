import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

export const GOAL_TYPES = ['저축', '투자', '비상금', '여행', '교육', '기타'];

export type Goal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  type: string;
  deadline: string;
  color: string;
};

interface GoalEditModalProps {
  visible: boolean;
  goal: Goal | null;
  onSave: (updated: Goal) => void;
  onClose: () => void;
}

export default function GoalEditModal({ visible, goal, onSave, onClose }: GoalEditModalProps) {
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [selectedType, setSelectedType] = useState('저축');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTargetAmount(goal.target_amount.toString());
      setCurrentAmount(goal.current_amount.toString());
      setSelectedType(goal.type);
      setDeadline(goal.deadline);
    }
  }, [goal]);

  const handleSave = () => {
    if (!goal || !title || !targetAmount) return;
    onSave({
      ...goal,
      title,
      target_amount: parseInt(targetAmount) || 0,
      current_amount: parseInt(currentAmount) || 0,
      type: selectedType,
      deadline,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.title}>목표 수정</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={18} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* 목표 이름 */}
            <TextInput
              style={styles.input}
              placeholder="목표 이름"
              placeholderTextColor={Colors.textHint}
              value={title}
              onChangeText={setTitle}
            />

            {/* 목표 금액 */}
            <View style={[styles.amountRow, { marginTop: 12 }]}>
              <Text style={styles.amountPrefix}>₩</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="목표 금액"
                placeholderTextColor={Colors.textHint}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="numeric"
              />
            </View>

            {/* 현재 금액 */}
            <View style={[styles.amountRow, { marginTop: 12 }]}>
              <Text style={[styles.amountPrefix, { color: Colors.primary }]}>₩</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="현재 금액"
                placeholderTextColor={Colors.textHint}
                value={currentAmount}
                onChangeText={setCurrentAmount}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.amountHint}>현재까지 모은 금액을 입력하세요</Text>

            {/* 타입 선택 */}
            <View style={[styles.typeRow, { marginTop: 12 }]}>
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
            <View style={{ marginTop: 12 }}>
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
                <TouchableOpacity style={styles.dateButton}>
                  <Text style={[styles.dateText, !deadline && { color: Colors.textHint }]}>
                    {deadline || '기한 선택'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* 저장 버튼 */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>저장</Text>
            </TouchableOpacity>
          </ScrollView>
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
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.textDark,
    fontSize: 18,
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
  input: {
    backgroundColor: Colors.bgMain,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textDark,
    fontSize: 15,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgMain,
    borderRadius: 12,
    padding: 14,
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
  amountHint: {
    color: Colors.textHint,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
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
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
