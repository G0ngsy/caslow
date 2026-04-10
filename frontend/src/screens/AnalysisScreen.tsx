import { PieChart, LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { getExpensesByCategory, getExpensesByMonth, getCategories, getAiInsight } from '../lib/api';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';


const screenWidth = Dimensions.get('window').width;
const Y_AXIS_WIDTH = 36;
const END_SPACING = 8;
// 카드 margin(16*2) + padding(20*2) + yAxis + endSpacing 모두 제외
const lineChartWidth = screenWidth - 32 - 40 - Y_AXIS_WIDTH - END_SPACING;

// 카테고리 색상 매핑
const categoryColors: Record<string, string> = {
  cafe:         '#A78BFA',
  food:         '#F59E0B',
  transport:    '#3B82F6',
  shopping:     '#EC4899',
  subscription: '#10B981',
  etc:          '#6B7280',
};

// 카테고리 한글명 매핑
const categoryLabels: Record<string, string> = {
  cafe:         '카페',
  food:         '음식',
  transport:    '교통',
  shopping:     '쇼핑',
  subscription: '구독',
  etc:          '기타',
};

// 월 표시 형식 변환 (2026-04 → 4월)
function formatMonth(month: string): string {
  const m = parseInt(month.split('-')[1]);
  return `${m}월`;
}

// 금액 포맷 함수
function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}



export default function AnalysisScreen() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ month: string; amount: number } | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // 전체 / 변동 / 정기 탭 선택 상태
  const [expenseTab, setExpenseTab] = useState<'all' | 'variable' | 'fixed'>('all');
  // AI 인사이트 상태
  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  // 탭에 따라 카테고리 데이터 필터링
  // [정기] 메모가 있으면 정기 지출, 없으면 변동 지출
  const filteredCategoryData = categoryData; // API에서 받은 데이터 그대로 사용
  // 탭 필터는 API 레벨에서 처리해야 정확해요
  
  // 화면 포커스될 때마다 데이터 새로 불러오기
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [expenseTab])
  );

  const fetchData = async () => {
  setLoading(true);
  try {
    const [categoryRes, monthlyRes, categoriesRes] = await Promise.all([
      getExpensesByCategory(expenseTab),
      getExpensesByMonth(),
      getCategories(),
    ]);

    // 카테고리 데이터 변환
    const formattedCategory = categoryRes.map((item: any) => ({
      name: categoryLabels[item.category] || item.category,
      amount: item.amount,
      color: categoryColors[item.category] || '#6B7280',
      key: item.category,
    }));
    setCategoryData(formattedCategory);

    // 월별 데이터 변환
    const formattedMonthly = monthlyRes.map((item: any) => ({
      month: formatMonth(item.month),
      amount: item.amount,
    }));
    setMonthlyData(formattedMonthly);

  } catch (error) {
    console.error('분석 데이터 불러오기 실패:', error);
  } finally {
    setLoading(false);
  }

  // AI 인사이트는 별도로 불러오기 (시간이 걸려서 따로 처리)
  try {
    const insight = await getAiInsight();
    setAiInsight(insight.insight);
  } catch (error) {
    console.error('AI 인사이트 불러오기 실패:', error);
    setAiInsight('AI 인사이트를 불러오지 못했습니다.');
  } finally {
    setInsightLoading(false);
  }
};

     

  // 총 지출 계산
  const totalAmount = categoryData.reduce((sum, c) => sum + c.amount, 0);

  // gifted-charts PieChart용 데이터
  const pieData = categoryData.map((cat, i) => ({
    value: cat.amount,
    color: cat.color,
    focused: selectedIndex === i,
    onPress: () => setSelectedIndex(prev => prev === i ? null : i),
  }));

  // gifted-charts LineChart용 데이터
  const lineData = monthlyData.map(item => ({
    value: item.amount,
    label: item.month,
  }));

  const maxBar = Math.max(...monthlyData.map((d: any) => d.amount), 0);
  const maxValue = maxBar > 0 ? Math.ceil(maxBar * 1.3 / 10000) * 10000 : 90000;
  const selected = selectedIndex !== null ? categoryData[selectedIndex] : null;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="분석" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >

        {/* 카테고리별 지출 - 도넛 차트 */}
        <View style={styles.card}>
          {/* 제목 + 탭 필터 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={styles.cardTitle}>카테고리별 지출</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { key: 'all',      label: '전체' },
                { key: 'variable', label: '변동 지출' },
                { key: 'fixed',    label: '정기 지출' },
              ].map(tab => (
                <TouchableOpacity
                  key={tab.key}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: expenseTab === tab.key ? Colors.primary : Colors.border,
                    backgroundColor: expenseTab === tab.key ? Colors.primary : Colors.bgCard,
                  }}
                  onPress={() => setExpenseTab(tab.key as any)}
                >
                  <Text style={{
                    color: expenseTab === tab.key ? Colors.white : '#437CA1',
                    fontSize: 12,
                    fontWeight: expenseTab === tab.key ? 'bold' : 'normal',
                  }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <Text style={styles.totalLabel}>총 지출 ₩{formatAmount(totalAmount)}</Text>

            {/* 도넛 차트 */}
            <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <PieChart
              data={pieData}
              donut
              radius={72}
              innerRadius={46}
              focusOnPress
              toggleFocusOnPress
              innerCircleColor={Colors.bgCard}
              centerLabelComponent={() => (
                <View style={styles.donutCenter}>
                  {selected ? (
                    <>
                      <View style={[styles.donutCenterDot, { backgroundColor: selected.color }]} />
                      <Text style={styles.donutCenterName}>{selected.name}</Text>
                      <Text style={styles.donutCenterAmount}>
                        {Math.round((selected.amount / totalAmount) * 100)}%
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.donutCenterHint}>총 지출</Text>
                      <Text style={styles.donutCenterTotal}>
                        {totalAmount >= 10000
                          ? `${(totalAmount / 10000).toFixed(totalAmount % 10000 === 0 ? 0 : 1)}만원`
                          : `₩${formatAmount(totalAmount)}`}
                      </Text>
                    </>
                  )}
                </View>
              )}
            />
            </View>

            {/* 카테고리 목록 */}
            <View style={styles.categoryList}>
              {categoryData.map((cat, i) => (
                <TouchableOpacity
                  key={cat.name}
                  style={[styles.categoryRow, selectedIndex === i && styles.categoryRowActive]}
                  onPress={() => setSelectedIndex(prev => prev === i ? null : i)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.categoryAmount}>₩{formatAmount(cat.amount)}</Text>
                    <Text style={styles.categoryPercent}>
                      {Math.round((cat.amount / totalAmount) * 100)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
        </View>

        {/* 월별 지출 추이 - 라인 차트 */}
        <View style={styles.card}>
          {/* 타이틀 + 선택된 월 정보 */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.cardTitle}>월별 지출 추이</Text>
            {selectedPoint && (
                <Text style={{ 
                  color: Colors.primary, 
                  fontSize: 12,        // 월(Month) 글씨는 살짝 작게
                  fontWeight: 'bold', 
                  textAlign: 'right',  // 오른쪽 정렬
                  lineHeight: 18       // 줄 간격 조절
                }}>
      {selectedPoint.month}{"\n"}
      <Text style={{ fontSize: 15 }}>₩{formatAmount(selectedPoint.amount)}</Text>
    </Text>
            )}
          </View>

          <LineChart
            data={lineData}
            areaChart
            curved
            color={Colors.primary}
            startFillColor={Colors.primary}
            endFillColor="rgba(37,93,170,0.03)"
            startOpacity={0.18}
            endOpacity={0.01}
            dataPointsColor={Colors.primary}
            dataPointsRadius={4}
            focusedDataPointColor={Colors.accent}
            focusedDataPointRadius={6}
            noOfSections={3}
            maxValue={maxValue}
            height={160}
            width={lineChartWidth}
            initialSpacing={20}
            endSpacing={END_SPACING}
            xAxisThickness={1}
            xAxisColor={Colors.border}
            yAxisThickness={0}
            yAxisTextStyle={{ color: '#437CA1', fontSize: 10 }}
            yAxisLabelWidth={Y_AXIS_WIDTH}
            formatYLabel={(v) => Number(v) === 0 ? '0' : `${Math.round(Number(v) / 10000)}만`}
            xAxisLabelTextStyle={{ color: '#437CA1', fontSize: 11 }}
            hideRules={false}
            rulesColor="#E3F2FF"
            rulesType="solid"
            onPress={(item: any) => {
              setSelectedPoint({ month: item.label, amount: item.value });
            }}
          />
        </View>

        {/* AI 인사이트 */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
              <Text style={styles.aiTitle}>AI 인사이트</Text>
            </View>
            {insightLoading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.aiText}>AI가 분석 중이에요...</Text>
              </View>
            ) : (
              <Text style={styles.aiText}>{aiInsight}</Text>
            )}
          </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 6,
    shadowColor: '#1A3A5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  cardTitle: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalLabel: {
    color: '#437CA1',
    fontSize: 12,
    marginBottom: 16,
  },
  // 도넛
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donutCenter: {
    alignItems: 'center',
    gap: 2,
  },
  donutCenterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  donutCenterName: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  donutCenterAmount: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  donutCenterHint: {
    color: Colors.textHint,
    fontSize: 11,
  },
  donutCenterTotal: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
  // 카테고리 목록
  categoryList: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D6E8F7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
    backgroundColor: '#F5FAFF',
  },
  categoryRowActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EAF2FF',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    color: Colors.textDark,
    fontSize: 12,
  },
  categoryAmount: {
    color: Colors.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryPercent: {
    color: '#ABCCEA',
    fontSize: 10,
  },
  // AI 인사이트
  aiCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D2EEFA',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  aiTitle: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  aiText: {
    color: '#37596E',
    fontSize: 14,
    lineHeight: 22,
  },
  pointerLabel: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  pointerMonth: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    marginBottom: 2,
  },
  pointerAmount: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
