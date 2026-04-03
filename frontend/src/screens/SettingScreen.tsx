import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// 스타일 정의
const styles = StyleSheet.create({
  // 전체 화면 컨테이너
  container: {
    flex: 1,
    backgroundColor: '#1A0033',
    padding: 24,
  },
  // 화면 제목
  title: {
    color: '#E6CCFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 16,
  },
  // 설정 항목 카드
  card: {
    backgroundColor: '#330066',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#7A00CC',
    marginBottom: 16,
  },
  // 설정 항목 텍스트
  cardText: {
    color: '#E6CCFF',
    fontSize: 16,
    fontWeight: '500',
  },
  // 로그아웃 버튼
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E24B4A',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  // 로그아웃 텍스트 (빨간색)
  logoutText: {
    color: '#E24B4A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function SettingScreen() {

 // 로그아웃 함수
const handleLogout = async () => {
  // 웹에서는 Alert.alert 대신 window.confirm 사용
  const confirmed = window.confirm('정말 로그아웃 하시겠습니까?');
  if (confirmed) {
    // Supabase 로그아웃 호출
    const { error } = await supabase.auth.signOut();
    if (error) {
      window.alert('오류: ' + error.message);
    }
    // 로그아웃 성공하면 App.tsx의 onAuthStateChange가
    // 자동으로 감지해서 로그인 화면으로 이동시켜줘요
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>

      {/* 카테고리 관리 (나중에 구현) */}
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardText}>카테고리 관리</Text>
      </TouchableOpacity>

      {/* 정기 지출 관리 (나중에 구현) */}
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardText}>정기 지출 관리</Text>
      </TouchableOpacity>

      {/* 예산 설정 (나중에 구현) */}
      <TouchableOpacity style={styles.card}>
        <Text style={styles.cardText}>예산 설정</Text>
      </TouchableOpacity>

      {/* 로그아웃 버튼 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

    </View>
  );
}