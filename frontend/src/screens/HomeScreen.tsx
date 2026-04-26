import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import CoinLoader from '../components/CoinLoader';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import { getExpenses, getBudget , getCategories  } from '../lib/api';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { categoryConfig, getCategoryIcon, categoryKeyMap } from '../constants/categories';

// 재테크 명언 목록
const quotes = [
  '작은 지출이 큰 부를 만든다.',
  '저축은 미래의 나에게 보내는 선물이다.',
  '소비하기 전에 한 번 더 생각하라.',
  '부자는 돈을 쓰는 방식이 다르다.',
  '지출을 기록하는 것이 부의 시작이다.',
  '오늘의 절약이 내일의 자유를 만든다.',
  '돈을 관리하지 않으면 돈이 나를 관리한다.',
  '가난은 수입이 적은 것이 아니라, 지출을 통제하지 못하는 것이다.',
  '필요하지 않은 물건을 사면, 머지않아 꼭 필요한 물건을 팔게 될 것이다.',
  '수입이 늘어나는 속도보다 지출이 늘어나는 속도를 늦춰라.',
  '가난한 사람들은 돈을 위해 일하고, 부자들은 돈이 자신을 위해 일하게 만든다.',
  '작은 지출을 조심하라. 작은 구멍이 거대한 배를 침몰시킨다.',
  '소비하고 남은 돈을 저축하지 말고, 저축하고 남은 돈을 소비하라.',
  '당신의 부를 결정하는 것은 얼마나 버느냐가 아니라, 얼마나 남기느냐이다.',
  '예산(Budget)은 돈에게 어디로 갈지 말해주는 것이다. 돈이 어디로 갔는지 궁금해하는 것이 아니라',
  '부자는 자신이 가진 돈이 아니라, 돈이 자신을 위해 일하게 만드는 능력에 의해 정의된다.',
  '가난이 수치는 아니다. 그러나 결코 명예도 아니다.',
  '당신이 잠자는 동안에도 돈이 들어노는 방법을 찾지 못한다면 당신은 죽을 때까지 일을 해야 할 것이다.',
  '검소하게 사는 것은 빈곤이 아니라, 불필요한 물건을 줄여 내면의 자유를 얻는 것이다.',
  '소득이 아니라, 저축한 금액이 당신의 부를 결정한다.'

];

// 금액 포맷 함수
function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}



// 오늘/지난 구분 함수
function getDateLabel(dateStr: string): string {
  // 한국 시간 기준 오늘 날짜
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (dateStr === today) return '오늘';
  return '지난';
}

// 시간대별 인사말
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good Morning 🌅';
  if (hour >= 12 && hour < 18) return 'Good Afternoon ☀️';
  if (hour >= 18 && hour < 22) return 'Good Evening 🌆';
  return 'Good Night 🌙';
}

// 랜덤 명언
function getRandomQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,       // #E3F2FF
  },
  header: {
    backgroundColor: Colors.bgHeader,     // #1B1E3E
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#255DAA',
  },
  logo: {
    color: Colors.accentLight,            // #FAD493
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  greetingBox: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  greeting: {
    color: '#437CA1',
    fontSize: 16,
    marginBottom: 6,
  },
  quote: {
    color: '#255DAA',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#1B1E3E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#255DAA',
    shadowColor: '#255DAA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryLabel: {
    color: Colors.textSub,                // #A3D8F1
    fontSize: 15,
    marginBottom: 8,
  },
  summaryAmount: {
    color: Colors.accentLight,            // #FAD493
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summarySubText: {
    color: '#437CA1',
    fontSize: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D3052',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#255DAA',
  },
  sortButtonText: {
    color: Colors.textSub,                // #A3D8F1
    fontSize: 12,
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 36,
    backgroundColor: '#1D3052',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#255DAA',
    zIndex: 999,
    minWidth: 90,
  },
  dropdownItem: {
    padding: 12,
  },
  dropdownText: {
    color: Colors.textSub,                // #A3D8F1
    fontSize: 13,
  },
  dropdownTextActive: {
    color: Colors.accentLight,            // #FAD493
    fontWeight: 'bold',
  },
  filterContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',         // 줄바꿈
  paddingHorizontal: 16,
  paddingVertical: 5,
  gap: 8,
},
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,           // #ABCCEA
    backgroundColor: Colors.bgCard,      // #FFFFFF
    marginRight: 10,
    
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,     // #255DAA
    borderColor: Colors.primary,
  },
  filterText: {
    color: '#437CA1',
    fontSize: 13,
  },
  filterTextActive: {
    color: Colors.white,
  },
  sectionTitle: {
    color: '#437CA1',
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,      // #FFFFFF
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D2EEFA',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  expenseAmount: {
    color: Colors.danger,               // #DE525E
    fontSize: 15,
    fontWeight: 'bold',
  },
  expenseDate: {
    color: '#ABCCEA',
    fontSize: 12,
    marginTop: 2,
  },

  summaryHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},
summaryHeaderLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
summaryMonth: {
  color: Colors.accentLight,
  fontSize: 13,
  fontWeight: 'bold',
  backgroundColor: '#27435F',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 20,
},
summaryCount: {
  color: '#A3D8F1',
  fontSize: 13,
  marginTop: 4,
  marginBottom: 16,
},
progressSection: {
  marginTop: 8,
},
progressLabelRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 6,
},
progressLabel: {
  color: '#A3D8F1',
  fontSize: 12,
},
progressPercent: {
  color: Colors.accentLight,
  fontSize: 12,
  fontWeight: 'bold',
},
progressBar: {
  height: 6,
  backgroundColor: '#27435F',
  borderRadius: 3,
  overflow: 'hidden',
},
progressFill: {
  height: '100%',
  backgroundColor: Colors.accentLight,
  borderRadius: 3,
},
warningBanner: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FF3B30',
  marginHorizontal: 16,
  marginBottom: 4,
  marginTop: 5,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 10,
  gap: 8,
},
warningBannerText: {
  color: '#fff',
  fontSize: 13,
  fontWeight: '600',
  flex: 1,
},
progressFooter: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 6,
},
progressFooterText: {
  color: '#A3D8F1',
  fontSize: 11,
},

listHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  marginTop: 8,
  marginBottom: 4,
},
listTitle: {
  color: Colors.textDark,
  fontSize: 16,
  fontWeight: 'bold',
},
sectionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 8,
},
sectionDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: Colors.primary,
},
expenseTitle: {
  color: Colors.textDark,
  fontSize: 15,
  fontWeight: '600',
},
expenseTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  
},
categoryBadge: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
},
categoryBadgeText: {
  fontSize: 11,
  fontWeight: '600',
},
dropdownRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

});

export default function HomeScreen() {
  // 카테고리 필터 선택 상태 (기본값: 전체)
  const [selectedCategory, setSelectedCategory] = useState('all');
  // 정렬 순서 상태 (최신순/과거순)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  // 정렬 드롭다운 표시 여부
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  // 백엔드에서 불러온 지출 목록
  const [expenses, setExpenses] = useState<any[]>([]);
  // 데이터 로딩 중 여부
  const [loadingData, setLoadingData] = useState(false);
  const navigation = useNavigation<any>();
  // categories 상태 추가
  const [categories, setCategories] = useState<any[]>([
    { key: 'all', label: '전체', icon: 'apps' },
  ]);

  const [budget, setBudget] = useState(0);

  // 화면 포커스될 때마다 지출 목록 새로 불러오기
// 지출 추가/수정/삭제 후 돌아올 때 자동 갱신
useFocusEffect(
  useCallback(() => {
    fetchExpenses();
    fetchBudget();
    fetchCategories();
  }, [])
);

// 예산 불러오기
const fetchBudget = async () => {
  try {
    const data = await getBudget();
    setBudget(data.amount);
  } catch (error) {
    console.error('예산 불러오기 실패:', error);
  }
};

// 카테고리 불러오기
const fetchCategories = async () => {
  try {
    const data = await getCategories();
    const categoryList = [
      { key: 'all', label: '전체', icon: 'apps' },
      ...data.map((cat: any) => ({
        key: cat.name,
        label: cat.name,
        icon: getCategoryIcon(cat.name),
        color: cat.color,
      }))
    ];
    setCategories(categoryList);
  } catch (error) {
    console.error('카테고리 불러오기 실패:', error);
  }
};

  // 백엔드 API에서 지출 목록 가져오는 함수
  const fetchExpenses = async () => {
    setLoadingData(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('지출 불러오기 실패:', error);
    } finally {
      setLoadingData(false);
    }
  };



 // 오늘 날짜 (한국 시간 기준)
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// 이번 달 + 오늘 이하 날짜만 필터링
const currentMonth = now.toISOString().slice(0, 7);

const validExpenses = expenses.filter((e: any) =>
  e.date && e.date.startsWith(currentMonth) && e.date <= today
);

// 선택된 카테고리로 지출 필터링 (한글/영문 둘 다 매칭)
const filteredExpenses = selectedCategory === 'all'
  ? validExpenses
  : validExpenses.filter((e: any) => {
      const matchKeys = categoryKeyMap[selectedCategory] || [selectedCategory];
      return matchKeys.includes(e.category);
    });


  // 최신순/과거순으로 정렬
const sortedExpenses = [...filteredExpenses].sort((a, b) => {
  if (sortOrder === 'newest') return b.date.localeCompare(a.date);
  return a.date.localeCompare(b.date);
});

const thisMonthExpenses = expenses.filter((e: any) => 
  e.date && e.date.startsWith(currentMonth)
);

 // 이번 달 총 지출 계산 (오늘 이하만)
const totalAmount = validExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

 // 오늘/지난으로 날짜별 그룹화
const grouped: Record<string, any[]> = {};
sortedExpenses.forEach(e => {
  const label = getDateLabel(e.date);
  if (!grouped[label]) grouped[label] = [];
  grouped[label].push(e);
});

  // 로딩 중일 때 스피너 표시
  if (loadingData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <CoinLoader size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <Header showLogo showIcons />
      <ScrollView showsVerticalScrollIndicator={false}>

      {/* 예산 초과 경고 배너 */}
      {budget > 0 && totalAmount > budget && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={18} color="#fff" />
          <Text style={styles.warningBannerText}>
            이번 달 예산을 {(totalAmount - budget).toLocaleString()}원 초과했어요!
          </Text>
        </View>
      )}

      {/* 인사말 + 명언 */}
      <View style={styles.greetingBox}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.quote}>"{getRandomQuote()}"</Text>
      </View>

      
      {/* 이번 달 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderLeft}>
              <Ionicons name="wallet-outline" size={20} color={Colors.textSub} />
              <Text style={styles.summaryLabel}>이번 달 총 지출</Text>
            </View>
            {/* 현재 월 동적으로 표시 */}
            <Text style={styles.summaryMonth}>{new Date().getMonth() + 1}월</Text>
          </View>
          <Text style={styles.summaryAmount}>₩{formatAmount(totalAmount)}</Text>
          <Text style={styles.summaryCount}>{thisMonthExpenses.length}건의 지출</Text>
          {budget > 0 && (() => {
            const ratio = totalAmount / budget;
            const isOver = ratio > 1;
            const fillColor = isOver ? '#FF3B30' : Colors.accentLight;
            return (
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>예산 대비</Text>
                  <Text style={[styles.progressPercent, isOver && { color: '#FF3B30' }]}>
                    {Math.round(ratio * 100)}%{isOver ? ' 초과' : ''}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, {
                    width: `${Math.min(ratio * 100, 100)}%`,
                    backgroundColor: fillColor,
                  }]} />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={[styles.progressFooterText, isOver && { color: '#FF3B30' }]}>
                    {isOver
                      ? `초과: ₩${formatAmount(totalAmount - budget)}`
                      : `잔여: ₩${formatAmount(budget - totalAmount)}`}
                  </Text>
                  <Text style={styles.progressFooterText}>예산: ₩{formatAmount(budget)}</Text>
                </View>
              </View>
            );
          })()}
        </View>

                   
          {/* 카테고리 필터 */}
          <View style={styles.filterContainer}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.filterButton,
                  selectedCategory === cat.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
      <Ionicons
        name={cat.icon as any}
        size={14}
        color={selectedCategory === cat.key ? Colors.white : '#437CA1'}
      />
      <Text style={[
        styles.filterText,
        selectedCategory === cat.key && styles.filterTextActive
      ]}>
        {cat.label}
      </Text>
    </TouchableOpacity>
  ))}
</View>
        

        {/* 지출 내역 헤더 */}
        <View style={[styles.listHeader, { zIndex: 999 }]}>
          <Text style={styles.listTitle}>지출 내역</Text>
          <View style={{ zIndex: 999 }}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortDropdown(!showSortDropdown)}
            >
              <Ionicons name="swap-vertical" size={14} color={Colors.textSub} />
              <Text style={styles.sortButtonText}>
                {sortOrder === 'newest' ? '최신순' : '과거순'}
              </Text>
              <Ionicons
                name={showSortDropdown ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={Colors.textSub}
              />
            </TouchableOpacity>

            {showSortDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { setSortOrder('newest'); setShowSortDropdown(false); }}
                >
                  <View style={styles.dropdownRow}>
                    <Text style={[styles.dropdownText, sortOrder === 'newest' && styles.dropdownTextActive]}>
                      최신순
                    </Text>
                    {sortOrder === 'newest' && (
                      <Ionicons name="checkmark" size={14} color={Colors.accentLight} />
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { setSortOrder('oldest'); setShowSortDropdown(false); }}
                >
                  <View style={styles.dropdownRow}>
                    <Text style={[styles.dropdownText, sortOrder === 'oldest' && styles.dropdownTextActive]}>
                      과거순
                    </Text>
                    {sortOrder === 'oldest' && (
                      <Ionicons name="checkmark" size={14} color={Colors.accentLight} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        

        {/* 지출 목록 */}
        {Object.entries(grouped).map(([label, items]) => (
          <View key={label}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionTitle}>{label}</Text>
            </View>
            {items.map(expense => {
              const config = categoryConfig[expense.category] || categoryConfig.default;
              return (
                
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseItem}
                  onPress={() => navigation.navigate('ExpenseDetail', { expense })}
                >
                  <View style={[styles.iconBox, { backgroundColor: config.color + '22' }]}>
                    <Ionicons name={config.icon as any} size={22} color={config.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.expenseTitleRow}>
                      <Text style={styles.expenseTitle}>{expense.title}</Text>
                      {/* 카테고리 뱃지 */}
                        <View style={[styles.categoryBadge, { backgroundColor: config.color + '22' }]}>
                          <Text style={[styles.categoryBadgeText, { color: config.color }]}>
                            {categories.find(c => c.key === expense.category)?.label 
                              || categoryConfig[expense.category]?.label 
                              || expense.category}
                          </Text>
                        </View>
                    </View>
                    <Text style={styles.expenseDate}>{expense.date}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>-₩{formatAmount(expense.amount)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}