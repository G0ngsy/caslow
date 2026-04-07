import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';

// 카테고리 목록
const categories = [
  { key: 'cafe',         label: '카페',   icon: 'cafe',                color: '#A78BFA' },
  { key: 'food',         label: '음식',   icon: 'restaurant',          color: '#F59E0B' },
  { key: 'transport',    label: '교통',   icon: 'bus',                 color: '#3B82F6' },
  { key: 'shopping',     label: '쇼핑',   icon: 'bag',                 color: '#EC4899' },
  { key: 'subscription', label: '구독',   icon: 'tv',                  color: '#10B981' },
  { key: 'etc',          label: '기타',   icon: 'ellipsis-horizontal', color: '#6B7280' },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,       // #E3F2FF
  },
  label: {
    color: '#437CA1',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  amountBox: {
    backgroundColor: Colors.bgCard,       // #FFFFFF
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,           // #ABCCEA
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    color: Colors.textDark,               // #1B1E3E
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: Colors.textDark,               // #1B1E3E
    fontSize: 24,
    fontWeight: 'bold',
  },
  aiAnalyzing: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 12,
},
aiAnalyzingText: {
  color: Colors.primary,
  fontSize: 12,
},
categoryGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  
},
categoryButton: {
  width: '30%',
  paddingVertical: 16,
  backgroundColor: Colors.bgCard,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: Colors.border,
  justifyContent: 'center',
  alignItems: 'center',
  gap: 8,
},
categoryButtonActive: {
  borderColor: Colors.primary,
  borderWidth: 2,
  backgroundColor: '#D2EEFA',
},
categoryText: {
  color: Colors.textDark,
  fontSize: 13,
},
categoryTextActive: {
  color: Colors.primary,
  fontWeight: 'bold',
},
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D2EEFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  aiBadgeText: {
    color: Colors.primary,               // #255DAA
    fontSize: 11,
  },
  dateButton: {
    backgroundColor: Colors.bgCard,      // #FFFFFF
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,          // #ABCCEA
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    color: Colors.textDark,              // #1B1E3E
    fontSize: 15,
  },
  memoInput: {
    backgroundColor: Colors.bgCard,      // #FFFFFF
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,          // #ABCCEA
    color: Colors.textDark,              // #1B1E3E
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 32,
    marginBottom: 40,
  },
});

interface ExpenseFormScreenProps {
  // 나중에 OCR 데이터 받을 때 사용
  initialData?: {
    amount?: string;
    category?: string;
    memo?: string;
  };
  onBack?: () => void;
}

export default function ExpenseFormScreen({ initialData, onBack }: ExpenseFormScreenProps) {
  // 입력 상태 관리
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [memo, setMemo] = useState(initialData?.memo || '');
  const navigation = useNavigation<any>();

  // AI 카테고리 추천 (나중에 실제 API 연동)
  const aiSuggestedCategory = 'cafe';

  // 저장 함수 (나중에 API 연동)
  const handleSave = () => {
    console.log('저장:', { amount, selectedCategory, date, memo });
  };

  return (
    <View style={styles.container}>
      <Header title="지출 입력" showBack 
      onBack={() => navigation.goBack()}  />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* 금액 입력 */}
        <Text style={styles.label}>금액</Text>
        <View style={styles.amountBox}>
          <Text style={styles.amountPrefix}>₩</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor="#ABCCEA"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* 카테고리 선택 */}
        <Text style={styles.label}>카테고리</Text>

        {/* AI 분석 중 표시 */}
        {aiSuggestedCategory && (
          <View style={styles.aiAnalyzing}>
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
            <Text style={styles.aiAnalyzingText}>AI 카테고리를 분석중...</Text>
          </View>
        )}

        <View style={styles.categoryGrid}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton,
                selectedCategory === cat.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={28}
                color={selectedCategory === cat.key ? cat.color : cat.color}
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === cat.key && styles.categoryTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI 추천 뱃지 */}
        {aiSuggestedCategory && (
          <TouchableOpacity
            style={styles.aiBadge}
            onPress={() => setSelectedCategory(aiSuggestedCategory)}
          >
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
            <Text style={styles.aiBadgeText}>
              AI 추천: {categories.find(c => c.key === aiSuggestedCategory)?.label}
            </Text>
          </TouchableOpacity>
        )}

        {/* 날짜 선택 */}
        <Text style={styles.label}>날짜</Text>
        <TouchableOpacity style={styles.dateButton}>
          <Text style={styles.dateText}>{date}</Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>

        {/* 메모 입력 */}
        <Text style={styles.label}>메모 (선택)</Text>
        <TextInput
          style={styles.memoInput}
          placeholder="메모를 입력해주세요"
          placeholderTextColor="#ABCCEA"
          value={memo}
          onChangeText={setMemo}
          multiline
        />

        {/* 저장 버튼 */}
        <View style={styles.saveButton}>
          <Button title="저장하기" onPress={handleSave} />
        </View>
      </ScrollView>
    </View>
  );
}