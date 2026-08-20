import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import Button from '../components/Button';
import { useNavigation, useRoute, useFocusEffect  } from '@react-navigation/native';
import { createExpense, updateExpense,getCategories  } from '../lib/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCategoryIcon } from '../constants/categories';

// 키워드 기반 카테고리 추천
function suggestCategory(memo: string): string {
  const text = memo.toLowerCase();
  if (text.match(/스타벅스|카페|커피|아메리카노|라떼|이디야|투썸/)) return 'cafe';
  if (text.match(/밥|식당|마트|편의점|배달|치킨|피자|버거|맥도날드|음식|점심|저녁/)) return 'food';
  if (text.match(/지하철|버스|택시|카카오택시|기름|주유|ktx|기차/)) return 'transport';
  if (text.match(/쇼핑|옷|신발|올리브영|다이소|쿠팡|구매/)) return 'shopping';
  if (text.match(/넷플릭스|유튜브|스포티파이|구독|멤버십/)) return 'subscription';
  return '';
}

function isValidDateString(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year
    && parsed.getMonth() === month - 1
    && parsed.getDate() === day;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  label: {
    color: '#437CA1',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
    letterSpacing: 0.5,
  },
  // 제목 입력
  titleInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textDark,
    fontSize: 15,
  },
  // 금액 입력
  amountBox: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountPrefix: {
    color: Colors.textDark,
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    color: Colors.textDark,
    fontSize: 24,
    fontWeight: 'bold',
  },
  // 카테고리 그리드
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
  // AI 추천 뱃지
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
    color: Colors.primary,
    fontSize: 11,
  },
  // 날짜 버튼
  dateButton: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    color: Colors.textDark,
    fontSize: 15,
  },
  // 메모 입력
  memoInput: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textDark,
    fontSize: 15,
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 32,
    marginBottom: 40,
  },
});

export default function ExpenseFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // 수정 모드 또는 OCR 데이터 확인
  const editingExpense = route.params?.expense;
  const ocrData = route.params?.ocrData;
  const isEditMode = !!editingExpense;
  const returnYear = Number(route.params?.returnYear || route.params?.initialYear);
  const returnMonth = Number(route.params?.returnMonth || route.params?.initialMonth);

  // 초기값 설정 (수정 모드 > OCR 데이터 > 기본값)
  const [title, setTitle] = useState(
    editingExpense?.title || ocrData?.title || ''
  );
  const [amount, setAmount] = useState(
    editingExpense?.amount?.toString() || ocrData?.amount?.toString() || ''
  );
  const [selectedCategory, setSelectedCategory] = useState(
    editingExpense?.category || ocrData?.category || ''
  );
  const [date, setDate] = useState(() => {
    if (editingExpense?.date) return editingExpense.date;
    if (ocrData?.date) return ocrData.date;
    const now = new Date();
    if (Number.isInteger(returnYear) && Number.isInteger(returnMonth) && returnMonth >= 1 && returnMonth <= 12) {
      const lastDay = new Date(returnYear, returnMonth, 0).getDate();
      const day = Math.min(now.getDate(), lastDay);
      return `${returnYear}-${String(returnMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [memo, setMemo] = useState(
    editingExpense?.memo || ocrData?.memo || ''
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState('');
  const [saving, setSaving] = useState(false);
  // DB에서 카테고리 불러오기
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (!route.params?.formSessionId || isEditMode) return;

    const current = new Date();
    const initialYear = Number(route.params?.initialYear);
    const initialMonth = Number(route.params?.initialMonth);
    let initialDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    if (Number.isInteger(initialYear) && Number.isInteger(initialMonth) && initialMonth >= 1 && initialMonth <= 12) {
      const day = Math.min(current.getDate(), new Date(initialYear, initialMonth, 0).getDate());
      initialDate = `${initialYear}-${String(initialMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    setTitle(ocrData?.title || '');
    setAmount(ocrData?.amount?.toString() || '');
    setSelectedCategory(ocrData?.category || '');
    setMemo(ocrData?.memo || '');
    setDate(ocrData?.date || initialDate);
    setAiSuggestedCategory('');
  }, [route.params?.formSessionId]);

  useFocusEffect(
  useCallback(() => {
    fetchCategories();
  }, [])
);

  const fetchCategories = async () => {

  try {
    const data = await getCategories();
    // DB 카테고리를 화면에 맞는 형식으로 변환
    const formatted = data.map((cat: any) => ({
      key: cat.name,
      label: cat.name,
      icon: getCategoryIcon(cat.name),
      color: cat.color,
    }));
    setCategories(formatted);
  } catch (error) {
    console.error('카테고리 불러오기 실패:', error);
  }
};


  // 저장 함수
  const handleSave = async () => {
  if (!title.trim()) {
    Alert.alert('알림','제목을 입력해주세요.');
    return;
  }
  const parsedAmount = Number(amount);
  if (!amount || !Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    Alert.alert('알림','금액은 1원 이상의 숫자로 입력해주세요.');
    return;
  }
  if (!isValidDateString(date)) {
    Alert.alert('알림','실제 존재하는 날짜를 YYYY-MM-DD 형식으로 입력해주세요.');
    return;
  }
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (date > todayString) {
    Alert.alert('알림','미래 날짜의 지출은 등록할 수 없습니다.');
    return;
  }
  if (!selectedCategory) {
    Alert.alert('알림','카테고리를 선택해주세요.');
    return;
  }

  setSaving(true);
  try {
    if (isEditMode) {
      await updateExpense(editingExpense.id, {
        title,
        amount: parsedAmount,
        category: selectedCategory,
        memo: memo || undefined,
        date,
      });
    } else {
      await createExpense({
        title,
        amount: parsedAmount,
        category: selectedCategory,
        memo: memo || undefined,
        date,
      });
    }
    const savedDate = date.split('-').map(Number);
    const navigateToLedger = () => navigation.getParent()?.navigate('홈', {
        screen: 'HomeMain',
        params: {
          year: Number.isInteger(returnYear) ? returnYear : savedDate[0],
          month: Number.isInteger(returnMonth) ? returnMonth : savedDate[1],
        },
      });
    Alert.alert(
      '알림',
      isEditMode ? '수정되었습니다!' : '저장되었습니다!',
      [{ text: '확인', onPress: navigateToLedger }],
    );
  } catch (error) {
    console.error('저장 실패:', error);
    Alert.alert('알림', error instanceof Error ? error.message : '저장에 실패했습니다.');
  } finally {
    setSaving(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header
        title={isEditMode ? '지출 수정' : ocrData ? 'OCR 자동 입력' : '지출 입력'}
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* 제목 입력 - 입력 시 AI 카테고리 추천 */}
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="지출 제목을 입력해주세요 (예: 스타벅스)"
          placeholderTextColor="#ABCCEA"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            // 제목 입력 시 AI 카테고리 추천
            const suggested = suggestCategory(text);
            setAiSuggestedCategory(suggested);
          }}
        />

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
                color={cat.color}
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

        {/* AI 추천 뱃지 - 메모 입력 시에만 표시 */}
        {aiSuggestedCategory && (
          <TouchableOpacity
            style={styles.aiBadge}
            onPress={() => setSelectedCategory(aiSuggestedCategory)}
          >
            <Ionicons name="sparkles" size={12} color={Colors.primary} />
            <Text style={styles.aiBadgeText}>
              AI 추천: {categories.find(c => c.key === aiSuggestedCategory)?.label} (탭하여 적용)
            </Text>
          </TouchableOpacity>
        )}

        {/* 날짜 선택 */}
        <Text style={styles.label}>날짜</Text>
        {Platform.OS === 'web' ? (
            // 웹에서는 텍스트 직접 입력
            <TextInput
              style={styles.dateButton}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#ABCCEA"
            />
          ) : (
            // 앱에서는 달력 선택
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{date}</Text>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>

        
          {/* 날짜 피커 - 앱용 */}
            {showDatePicker && (
              <DateTimePicker
                value={new Date(date)}
                maximumDate={new Date()}
                mode="date"
                display="default"
                onChange={(event: any, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    const now = selectedDate;
                    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    setDate(dateStr);
                   }
                  }}
                />
              )}
            </>
          )}

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
          <Button
            title={saving ? '저장 중...' : isEditMode ? '수정하기' : '저장하기'}
            onPress={handleSave}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
