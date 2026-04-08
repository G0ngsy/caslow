import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';

interface HeaderProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  showIcons?: boolean;  // 홈 화면에서만 아이콘 표시
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgHeader,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#255DAA',
  },
  logo: {
    color: Colors.accentLight,
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  // 오른쪽 아이콘 그룹
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});

export default function Header({ title, showLogo = false, showBack = false, onBack, showIcons = false }: HeaderProps) {
  const navigation = useNavigation<any>();
  return (
  <View style={styles.container}>
    {showBack && (
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={Colors.white} />
      </TouchableOpacity>
    )}

    {/* 로고 or 타이틀 */}
    {showLogo
      ? <Text style={styles.logo}>Caslow</Text>
      : <Text style={styles.title}>{title}</Text>
    }

    {/* 가운데 홈 텍스트 (showLogo일 때만) */}
    {showLogo && (
      <Text style={{
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
      }}>홈</Text>
    )}

    {/* 오른쪽 아이콘 */}
    {showIcons && (
      <View style={styles.iconGroup}>
        <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
          <Ionicons name="chatbubble-outline" size={22} color={Colors.accentLight} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={22} color={Colors.accentLight} />
        </TouchableOpacity>
      </View>
    )}
  </View>
);
}