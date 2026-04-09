import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';

export type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
  textColor: string;
};

const DEFAULT_COLORS = [
  { color: '#FFF3E0', textColor: '#E65100' },
  { color: '#FFF8E1', textColor: '#F57F17' },
  { color: '#E8EAF6', textColor: '#283593' },
  { color: '#FCE4EC', textColor: '#880E4F' },
  { color: '#E8F5E9', textColor: '#1B5E20' },
  { color: '#F3E5F5', textColor: '#4A148C' },
  { color: '#E3F2FD', textColor: '#0D47A1' },
  { color: '#FBE9E7', textColor: '#BF360C' },
];

interface CategoryEditModalProps {
  visible: boolean;
  categories: Category[];
  onSave: (categories: Category[]) => void;
  onClose: () => void;
}

export default function CategoryEditModal({ visible, categories, onSave, onClose }: CategoryEditModalProps) {
  const [list, setList] = useState<Category[]>(categories);
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const colorSet = DEFAULT_COLORS[list.length % DEFAULT_COLORS.length];
    const newCat: Category = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      icon: '📌',
      ...colorSet,
    };
    setList([...list, newCat]);
    setNewLabel('');
  };

  const handleDelete = (id: string) => {
    setList(list.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    onSave(list);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.box}>
          <View style={styles.header}>
            <Text style={styles.title}>카테고리 편집</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 기존 카테고리 목록 */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {list.map((cat) => (
              <View key={cat.id} style={styles.listItem}>
                <View style={[styles.chip, { backgroundColor: cat.color }]}>
                  <Text style={styles.chipIcon}>{cat.icon}</Text>
                  <Text style={[styles.chipText, { color: cat.textColor }]}>{cat.label}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(cat.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* 새 카테고리 추가 */}
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>새 카테고리 추가</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="아이콘 포함 이름 (예: ☕ 카페)"
                value={newLabel}
                onChangeText={setNewLabel}
                placeholderTextColor="#BBBBBB"
              />
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>추가</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>저장</Text>
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
    maxHeight: '80%',
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
  list: {
    maxHeight: 220,
    marginBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 6,
  },
  deleteText: {
    fontSize: 14,
    color: '#E53935',
    fontWeight: '700',
  },
  addSection: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 14,
    marginBottom: 14,
  },
  addTitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 10,
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#1B1E3E',
    backgroundColor: '#F8F8FA',
    outlineStyle: 'none' as any,
  },
  addBtn: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
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
