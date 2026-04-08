import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import { useState } from 'react';

const screenWidth = Dimensions.get('window').width;
const Y_AXIS_WIDTH = 36;
const END_SPACING = 8;
// 카드 margin(16*2) + padding(20*2) + yAxis + endSpacing 모두 제외
const lineChartWidth = screenWidth - 32 - 40 - Y_AXIS_WIDTH - END_SPACING;

// 더미 데이터
const categoryData = [
  { name: '쇼핑',  amount: 32000, color: '#EC4899' },
  { name: '음식',  amount: 12000, color: '#F59E0B' },
  { name: '카페',  amount: 5500,  color: '#A78BFA' },
  { name: '구독',  amount: 17000, color: '#10B981' },
  { name: '교통',  amount: 1400,  color: '#3B82F6' },
];

const monthlyRaw = [
  { month: '11월', amount: 65000 },
  { month: '12월', amount: 85000 },
  { month: '1월',  amount: 50000 },
  { month: '2월',  amount: 55000 },
  { month: '3월',  amount: 45000 },
  { month: '4월',  amount: 67900 },
];

const totalAmount = categoryData.reduce((sum, c) => sum + c.amount, 0);

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
}


export default function AnalysisScreen() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ month: string; amount: number } | null>(null);

  // gifted-charts PieChart용 데이터
  const pieData = categoryData.map((cat, i) => ({
    value: cat.amount,
    color: cat.color,
    focused: selectedIndex === i,
    onPress: () => setSelectedIndex(prev => prev === i ? null : i),
  }));

  // gifted-charts LineChart용 데이터
  const lineData = monthlyRaw.map(item => ({
    value: item.amount,
    label: item.month,
  }));

  const maxBar = Math.max(...monthlyRaw.map(d => d.amount));
  const maxValue = maxBar > 0 ? Math.ceil(maxBar * 1.3 / 10000) * 10000 : 90000;
  const selected = selectedIndex !== null ? categoryData[selectedIndex] : null;

  return (
    <View style={styles.container}>
      <Header title="분석" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
      >

        {/* 카테고리별 지출 - 도넛 차트 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별 지출</Text>
          <Text style={styles.totalLabel}>총 지출 ₩{formatAmount(totalAmount)}</Text>

          <View style={styles.donutRow}>
            {/* 도넛 차트 */}
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
                        {Math.round(totalAmount / 10000)}만원
                      </Text>
                    </>
                  )}
                </View>
              )}
            />

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
          <Text style={styles.aiText}>
            이번 달 총 지출이 ₩{formatAmount(totalAmount)}으로 나타났습니다.
            쇼핑과 구독 서비스 비용이 전체의 {Math.round(((32000 + 17000) / totalAmount) * 100)}%를 차지하고 있어요.
            불필요한 구독 서비스를 점검하고 쇼핑 지출을 줄이면 절약에 도움이 될 것 같아요.
          </Text>
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
    marginBottom: 16,
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
