import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

// 임시 더미 데이터
const dummyExpenses = [
  { id: '1', title: '스타벅스', category: 'cafe', amount: 5500, date: '2026-04-06' },
  { id: '2', title: '올리브영', category: 'shopping', amount: 32000, date: '2026-04-06' },
  { id: '3', title: '버거킹', category: 'food', amount: 12000, date: '2026-04-05' },
  { id: '4', title: '지하철', category: 'transport', amount: 1400, date: '2026-04-05' },
  { id: '5', title: '넷플릭스', category: 'subscription', amount: 17000, date: '2026-04-05' },
];

// 카테고리별 아이콘 및 색상
const categoryConfig: Record<string, { icon: string; color: string }> = {
  cafe:         { icon: 'cafe',                color: '#A78BFA' },
  food:         { icon: 'restaurant',          color: '#F59E0B' },
  transport:    { icon: 'bus',                 color: '#3B82F6' },
  shopping:     { icon: 'bag',                 color: '#EC4899' },
  subscription: { icon: 'tv',                  color: '#10B981' },
  default:      { icon: 'card',                color: '#6B7280' },
};

// 카테고리 필터 목록
const categories = [
  { key: 'all',          label: '전체', icon: 'apps' },
  { key: 'cafe',         label: '카페', icon: 'cafe' },
  { key: 'food',         label: '음식', icon: 'restaurant' },
  { key: 'transport',    label: '교통', icon: 'bus' },
  { key: 'shopping',     label: '쇼핑', icon: 'bag' },
  { key: 'subscription', label: '구독', icon: 'tv' },
  { key: 'etc',          label: '기타', icon: 'ellipsis-horizontal' },
];

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
];

// 금액 포맷 함수
function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

// 오늘/지난 구분 함수
function getDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
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
    backgroundColor: Colors.bgMain,
  },
  header: {
    backgroundColor: '#0F0720',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#6B3FA0',
  },
  logo: {
    color: '#C4B5FD',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerTitle: {
    color: '#F3E8FF',
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
    color: '#8B5CF6',
    fontSize: 16,
    marginBottom: 6,
  },
  quote: {
    color: '#6B3FA0',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#2D1B54',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#6B3FA0',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryLabel: {
    color: '#C4B5FD',
    fontSize: 13,
    marginBottom: 8,
  },
  summaryAmount: {
    color: '#F3E8FF',
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
    color: '#8B5CF6',
    fontSize: 12,
  },
  sortButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#F5EEF8',
  paddingHorizontal: 10,
  paddingVertical: 6,
},
sortButtonText: {
  color: '#d1a3ff',
  fontSize: 12,
},
dropdown: {
  position: 'absolute',
  right: 0,
  top: 36,
  backgroundColor: '#2D1B54',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#6B3FA0',
  zIndex: 999,
  minWidth: 90,
},
dropdownItem: {
  padding: 12,
},
dropdownText: {
  color: '#d1a3ff',
  fontSize: 13,
},
dropdownTextActive: {
  color: '#F3E8FF',
  fontWeight: 'bold',
},
  filterContainer: {
    marginVertical: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#6B3FA0',
    backgroundColor: '#F5EEF8',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  filterText: {
    color: '#6B3FA0',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#F3E8FF',
  },
  sectionTitle: {
    color: '#6B3FA0',
    fontSize: 13,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE9F6',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseTitle: {
    color: '#2D1B54',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  expenseAmount: {
    color: '#E11D48',
    fontSize: 15,
    fontWeight: 'bold',
  },
  expenseDate: {
  color: '#9CA3AF',
  fontSize: 12,
  marginTop: 2,
},
});

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // 카테고리 필터 적용
  const filteredExpenses = selectedCategory === 'all'
    ? dummyExpenses
    : dummyExpenses.filter(e => e.category === selectedCategory);

  // 정렬 적용
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortOrder === 'newest') return b.date.localeCompare(a.date);
    return a.date.localeCompare(b.date);
  });

  // 총 지출 계산
  const totalAmount = dummyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 날짜별 그룹화
  const grouped: Record<string, typeof dummyExpenses> = {};
  sortedExpenses.forEach(e => {
    const label = getDateLabel(e.date);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(e);
  });

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.logo}>Caslow</Text>
        <Text style={styles.headerTitle}>홈</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#C4B5FD" />
        </TouchableOpacity>
      </View>

      {/* 인사말 + 명언 */}
      <View style={styles.greetingBox}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.quote}>"{getRandomQuote()}"</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 이번 달 요약 카드 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>이번 달 총 지출</Text>
          <Text style={styles.summaryAmount}>- {formatAmount(totalAmount)}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summarySubText}>2026년 4월</Text>
          </View>
        </View>

        {/* 카테고리 필터 + 정렬 드롭다운 */}
        <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 999 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.filterContainer, { flex: 1 }]}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
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
                  color={selectedCategory === cat.key ? '#F3E8FF' : '#6B3FA0'}
                />
                <Text style={[
                  styles.filterText,
                  selectedCategory === cat.key && styles.filterTextActive
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 정렬 드롭다운 */}
          <View style={{ marginRight: 16, zIndex: 999 }}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setShowSortDropdown(!showSortDropdown)}
            >
              <Ionicons name="swap-vertical" size={14} color="#C4B5FD" />
              <Text style={styles.sortButtonText}>
                {sortOrder === 'newest' ? '최신순' : '과거순'}
              </Text>
              <Ionicons
                name={showSortDropdown ? 'chevron-up' : 'chevron-down'}
                size={12}
                color="#C4B5FD"
              />
            </TouchableOpacity>

            {showSortDropdown && (
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { setSortOrder('newest'); setShowSortDropdown(false); }}
                >
                  <Text style={[styles.dropdownText, sortOrder === 'newest' && styles.dropdownTextActive]}>
                    최신순
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { setSortOrder('oldest'); setShowSortDropdown(false); }}
                >
                  <Text style={[styles.dropdownText, sortOrder === 'oldest' && styles.dropdownTextActive]}>
                    과거순
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 지출 목록 */}
        {Object.entries(grouped).map(([label, items]) => (
          <View key={label}>
            <Text style={styles.sectionTitle}>{label}</Text>
            {items.map(expense => {
              const config = categoryConfig[expense.category] || categoryConfig.default;
              return (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={[styles.iconBox, { backgroundColor: config.color + '22' }]}>
                    <Ionicons name={config.icon as any} size={22} color={config.color} />
                  </View>
                  {/* 지출명 + 날짜 */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseDate}>{expense.date}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>- {formatAmount(expense.amount)}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}