import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    {/* 왼쪽 */}
    <View style={{ flex: 1 }}>
      {showBack && (
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}
      {showLogo && <Text style={styles.logo}>Caslow</Text>}
    </View>

    {/* 가운데 */}
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.title}>{showLogo ? '홈' : title}</Text>
    </View>

    {/* 오른쪽 */}
    <View style={{ flex: 1, alignItems: 'flex-end' }}>
      {showIcons && (
        <View style={styles.iconGroup}>
          <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.accentLight} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);
}