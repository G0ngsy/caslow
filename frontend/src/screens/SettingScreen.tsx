import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { Colors } from '../constants/colors';

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgMain,    // #E3F2FF
  },
  content: {
    padding: 24,
  },
  card: {
    backgroundColor: Colors.bgCard,    // #FFFFFF
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,        // #ABCCEA
    marginBottom: 16,
    shadowColor: '#255DAA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    color: Colors.textDark,            // #1B1E3E
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: Colors.danger,    // #DE525E
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: Colors.white,
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
      {/* 커스텀 헤더 */}
      <Header title="설정" />

      <View style={styles.content}>
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
    </View>
  );
}