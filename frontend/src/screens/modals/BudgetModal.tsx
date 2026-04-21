import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';

interface BudgetModalProps {
  visible: boolean;
  currentBudget: number;
  onSave: (budget: number) => void;
  onClose: () => void;
}

export default function BudgetModal({ visible, currentBudget, onSave, onClose }: BudgetModalProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (visible) setValue(currentBudget.toString());
  }, [visible, currentBudget]);

  const handleSave = () => {
    const num = parseInt(value.replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      onSave(num);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.box}>
          <View style={styles.header}>
            <Text style={styles.title}>월 예산 설정</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.currency}>₩</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              placeholder="예산 입력"
              autoFocus
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>저장</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 360,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1E3E',
  },
  close: {
    fontSize: 16,
    color: '#888',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4B6BFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    gap: 8,
  },
  currency: {
    fontSize: 16,
    color: '#1B1E3E',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1B1E3E',
    outlineStyle: 'none' as any,
  },
  saveButton: {
    backgroundColor: '#4B6BFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
