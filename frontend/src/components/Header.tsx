import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title?: string;        // 화면 제목
  showLogo?: boolean;    // 로고 표시 여부 (홈 화면)
  showBack?: boolean;    // 뒤로가기 버튼 여부
  onBack?: () => void;   // 뒤로가기 함수
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A0033',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#A14EFF',
  },
  // 로고 텍스트 (홈 화면)
  logo: {
    color: '#E6CCFF',
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  // 메뉴명 텍스트
  title: {
    color: '#E6CCFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  // 뒤로가기 버튼
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
});

export default function Header({ title, showLogo = false, showBack = false, onBack }: HeaderProps) {
  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      {showBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color="#E6CCFF" />
        </TouchableOpacity>
      )}

      {/* 로고 or 메뉴명 */}
      {showLogo
        ? <Text style={styles.logo}>Caslow</Text>
        : <Text style={styles.title}>{title}</Text>
      }
    </View>
  );
}