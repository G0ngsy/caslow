import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Colors } from '../../constants/colors';
import { getCategoryEmoji } from '../../constants/categories';

export type Category = {
  id: string;
  name: string;
  color: string;
};

const DEFAULT_COLORS = [
  '#A78BFA', '#F59E0B', '#3B82F6', '#EC4899',
  '#10B981', '#6B7280', '#EF4444', '#8B5CF6',
];

interface CategoryEditModalProps {
  visible: boolean;
  categories: Category[];
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function CategoryEditModal({
  visible,
  categories,
  onAdd,
  onDelete,
  onClose,
}: CategoryEditModalProps) {
  const [newLabel, setNewLabel] = useState('');

  // 모달 닫힐 때 입력값 초기화
  useEffect(() => {
    if (!visible) setNewLabel('');
  }, [visible]);

  const handleAdd = () => {
  if (!newLabel.trim()) return;
  
  // 이미 사용된 색상 제외
  const usedColors = categories.map((cat: any) => cat.color);
  const availableColors = DEFAULT_COLORS.filter(c => !usedColors.includes(c));
  
  // 사용 가능한 색상이 없으면 순환
  const color = availableColors.length > 0
    ? availableColors[0]
    : DEFAULT_COLORS[categories.length % DEFAULT_COLORS.length];

  onAdd(newLabel.trim(), color);
  setNewLabel('');
};

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.box}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>카테고리 편집</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 카테고리 목록 */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>카테고리가 없어요</Text>
            ) : (
              categories.map(cat => (
                <View key={cat.id} style={styles.listItem}>
                  <TouchableOpacity activeOpacity={1} style={[styles.chip, { backgroundColor: cat.color + '33' }]}>
                    <Text style={styles.chipIcon}>{getCategoryEmoji(cat.name)}</Text>
                    <Text style={[styles.chipText, { color: cat.color }]}>{cat.name}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onDelete(cat.id)}
                    style={styles.deleteBtn}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>

          {/* 새 카테고리 추가 */}
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>새 카테고리 추가</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="카테고리 이름 (예: 카페, 병원)"
                value={newLabel}
                onChangeText={setNewLabel}
                placeholderTextColor="#BBBBBB"
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 닫기 버튼 */}
          <TouchableOpacity style={styles.saveButton} onPress={onClose}>
            <Text style={styles.saveText}>닫기</Text>
          </TouchableOpacity>
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
    maxHeight: '80%',
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
  close: {
    color: Colors.textDark,
    fontSize: 18,
  },
  list: {
    maxHeight: 200,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
  },
  deleteText: {
    color: Colors.danger,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.textHint,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  addSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 16,
    marginBottom: 16,
  },
  addTitle: {
    color: Colors.textDark,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
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
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  saveText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
});