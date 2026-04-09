import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { Category } from './CategoryEditModal';

export type RecurringItem = {
  id: string;
  name: string;
  amount: number;
  category: string;
  day: number;
};

interface RecurringModalProps {
  visible: boolean;
  categories: Category[];
  onAdd: (item: RecurringItem) => void;
  onClose: () => void;
}

export default function RecurringModal({ visible, categories, onAdd, onClose }: RecurringModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [day, setDay] = useState('1');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // 선택된 카테고리가 목록에 없으면 첫번째로 리셋
  const selectedCategory = categories.find((c) => c.name === category) ? category : (categories[0]?.name ?? '');

  const handleAdd = () => {
  const num = parseInt(amount.replace(/,/g, ''), 10);
  const dayNum = parseInt(day, 10);
  if (!name.trim() || isNaN(num) || num <= 0 || isNaN(dayNum) || dayNum < 1 || dayNum > 31) return;

  // SettingScreen의 handleAddRecurring이 기대하는 형식으로 전달
  onAdd({
    id: Date.now().toString(),
    name: name.trim(),
    amount: num,
    category: selectedCategory,
    day: dayNum,
  });

  setName('');
  setAmount('');
  setDay('1');
  setDropdownOpen(false);
  onClose();
};

  const handleClose = () => {
    setName('');
    setAmount('');
    setDay('1');
    setDropdownOpen(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} style={styles.box}>
          <View style={styles.header}>
            <Text style={styles.title}>정기 지출 등록</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 이름 입력 */}
          <TextInput
            style={styles.input}
            placeholder="지출 이름"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#BBBBBB"
          />

          {/* 금액 입력 */}
          <View style={styles.rowInput}>
            <Text style={styles.rowLabel}>₩</Text>
            <TextInput
              style={styles.rowTextInput}
              placeholder="금액"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#BBBBBB"
            />
          </View>

          {/* 날짜 입력 */}
          <View style={styles.rowInput}>
            <Text style={styles.rowLabel}>매월</Text>
            <TextInput
              style={styles.rowTextInput}
              placeholder="일"
              value={day}
              onChangeText={setDay}
              keyboardType="numeric"
              placeholderTextColor="#BBBBBB"
            />
            <Text style={styles.rowLabel}>일</Text>
          </View>

          {/* 카테고리 드롭다운 */}
          <TouchableOpacity style={styles.dropdown} onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={styles.dropdownText}>{selectedCategory || '카테고리 선택'}</Text>
            <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownList}>
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.dropdownItem, cat.name === selectedCategory && styles.dropdownItemSelected]}
                    onPress={() => { setCategory(cat.name); setDropdownOpen(false); }}
                  >
                    <Text style={[styles.dropdownItemText, cat.name === selectedCategory && styles.dropdownItemTextSelected]}>
                      {cat.name}
                    </Text>
                    {cat.name === selectedCategory && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
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
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  input: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1B1E3E',
    marginBottom: 10,
    outlineStyle: 'none' as any,
    backgroundColor: '#F8F8FA',
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F8F8FA',
    marginBottom: 10,
    gap: 6,
  },
  rowLabel: {
    fontSize: 14,
    color: '#888',
    paddingVertical: 10,
  },
  rowTextInput: {
    flex: 1,
    fontSize: 15,
    color: '#1B1E3E',
    paddingVertical: 10,
    outlineStyle: 'none' as any,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8F8FA',
    marginBottom: 10,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1B1E3E',
  },
  dropdownArrow: {
    fontSize: 11,
    color: '#888',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF8E1',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1B1E3E',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#E6A817',
  },
  checkmark: {
    color: '#E6A817',
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#4B6BFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
