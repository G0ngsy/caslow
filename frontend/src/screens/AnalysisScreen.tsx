import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import Header from '../components/Header';
import React, { useState } from 'react';

const screenWidth = Dimensions.get('window').width;

// 더미 데이터
const categoryData = [
  { name: '쇼핑',  amount: 32000, color: '#EC4899', key: 'shopping' },
  { name: '음식',  amount: 12000, color: '#F59E0B', key: 'food' },
  { name: '카페',  amount: 5500,  color: '#A78BFA', key: 'cafe' },
  { name: '구독',  amount: 17000, color: '#10B981', key: 'subscription' },
  { name: '교통',  amount: 1400,  color: '#3B82F6', key: 'transport' },
  { name: '기타',  amount: 0,     color: '#ABCCEA', key: 'etc' },
];

const monthlyData = {
  labels: ['11월', '12월', '1월', '2월', '3월', '4월'],
  datasets: [{ data: [0, 0, 0, 0, 45000, 67900] }],
};

const totalAmount = categoryData.reduce((sum, c) => sum + c.amount, 0);

function formatAmount(amount: number): string {
  return amount.toLocaleString('ko-KR');
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
    elevation: 2, // Android 그림자 (그대로 유지)
    // ✅ shadow* 대신 boxShadow 사용 (RN 0.76+ deprecated 경고 제거)
    boxShadow: '0px 2px 4px rgba(27, 30, 62, 0.1)',
  },
  cardTitle: {
    color: Colors.textDark,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  // 도넛 차트
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryList: {
    flex: 1,
    marginLeft: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    color: Colors.textDark,
    fontSize: 13,
  },
  categoryAmount: {
    color: Colors.textDark,
    fontSize: 13,
    fontWeight: '600',
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
});

export default function AnalysisScreen() {
  const pieData = categoryData.map(cat => ({
    name: cat.name,
    population: cat.amount,
    color: cat.color,
    legendFontColor: Colors.textDark,
    legendFontSize: 12,
  }));

  return (
  <View style={styles.container}>
    <Header title="분석" />
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
    >
              {/* 파이 차트 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>카테고리별 지출</Text>
          
          {/* 총 지출액 */}
          <Text style={{ color: '#437CA1', fontSize: 12, marginBottom: 12 }}>
            총 지출 ₩{formatAmount(totalAmount)}
          </Text>

          <View style={styles.donutRow}>
            <PieChart
              data={pieData}
              width={160}
              height={160}
              chartConfig={{ color: () => Colors.primary }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="30"
              hasLegend={false}
            />
            {/* ✅ 카테고리 목록: 각 항목에 박스 카드 테두리 */}
    <View style={styles.categoryList}>
      {categoryData.map(cat => (
        <View
          key={cat.key}
          style={[
            styles.categoryRow,
            {
              // 박스 카드 테두리
              borderWidth: 1,
              borderColor: '#D6E8F7',
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginBottom: 3,
              backgroundColor: '#F5FAFF',
            }
          ]}
        >
          <View style={styles.categoryLeft}>
            <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
            <Text style={styles.categoryName}>{cat.name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.categoryAmount}>₩{formatAmount(cat.amount)}</Text>
            <Text style={{ color: '#ABCCEA', fontSize: 11 }}>
              {Math.round((cat.amount / totalAmount) * 100)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  </View>
</View>

        {/* 막대 그래프 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>월별 지출 추이</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 180, gap: 8, paddingTop: 16 }}>
            {[
              { month: '11월', amount: 0 },
              { month: '12월', amount: 0 },
              { month: '1월',  amount: 0 },
              { month: '2월',  amount: 0 },
              { month: '3월',  amount: 45000 },
              { month: '4월',  amount: 67900 },
            ].map((item, index) => {
              const maxAmount = 67900;
              const barHeight = item.amount > 0 ? (item.amount / maxAmount) * 130 : 4;
              return (
                <View key={index} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  {/* 막대 위 금액 */}
                  {item.amount > 0 && (
                    <Text style={{ color: Colors.primary, fontSize: 9, fontWeight: 'bold' }}>
                      {item.amount >= 10000
                        ? `${Math.round(item.amount / 10000)}만`
                        : `${formatAmount(item.amount)}`}
                    </Text>
                  )}
                  <View style={{
                    width: '70%',
                    height: barHeight,
                    backgroundColor: item.amount > 0 ? Colors.primary : '#D2EEFA',
                    borderRadius: 6,
                  }} />
                  <Text style={{ color: '#437CA1', fontSize: 11 }}>{item.month}</Text>
                </View>
              );
            })}
          </View>
        </View>

      {/* AI 인사이트 카드 */}
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