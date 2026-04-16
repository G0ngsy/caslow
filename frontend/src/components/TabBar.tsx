import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';


const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bgHeader,    // #1B1E3E
    borderTopWidth: 1,
    borderTopColor: '#255DAA',
    alignItems: 'center',
    height: 65,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  
  // 가운데 버튼 (튀어나오는 효과)
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,    // #255DAA
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 3,
    borderColor: Colors.bgMain,         // #E3F2FF
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    marginTop: -28,
  },
});

export default function TabBar({ state, descriptors, navigation }: any) {
  const tabs = [
    { name: '홈',   icon: 'home',      activeIcon: 'home' },
    { name: '분석', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
    { name: '입력', icon: 'create-outline', activeIcon: 'create', isCenter: true },
    { name: '목표', icon: 'flag-outline',      activeIcon: 'flag' },
    { name: '설정', icon: 'settings-outline',  activeIcon: 'settings' },
  ];

  return (
    <View style={styles.container}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tab = tabs[index];
        const isCenter = tab?.isCenter;

        const onPress = () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
          // 다른 탭에서 누를 때 → 해당 탭 첫 화면으로 이동
          // 같은 탭에서 누를 때 → 스택 리셋
          navigation.reset({
            index: 0,
            routes: [{ name: route.name }],
          });
        }
      };

       if (isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
            >
              <View style={styles.centerButton}>
                <MaterialCommunityIcons name="text-box-edit-outline" size={28} color={Colors.white} />
              </View>
              {/* 지출입력 메뉴명 */}
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? Colors.accentLight : '#437CA1' }
              ]}>
                지출입력
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
          >
            <Ionicons
              name={(isFocused ? tab?.activeIcon : tab?.icon) as any}
              size={22}
              color={isFocused ? Colors.accentLight : '#437CA1'}
            />
            <Text style={[
              styles.tabLabel,
              { color: isFocused ? Colors.accentLight : '#437CA1' }
            ]}>
              {tab?.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}