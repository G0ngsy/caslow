import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bgHeader,    // #1B1E3E
    borderTopWidth: 1,
    borderTopColor: '#255DAA',
    height: 64,
    alignItems: 'center',
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
    marginBottom: 24,
    borderWidth: 3,
    borderColor: Colors.bgMain,         // #E3F2FF
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default function TabBar({ state, descriptors, navigation }: any) {
  const tabs = [
    { name: '홈',   icon: 'home',      activeIcon: 'home' },
    { name: '분석', icon: 'bar-chart-outline', activeIcon: 'bar-chart' },
    { name: '입력', icon: 'add',       activeIcon: 'add',  isCenter: true },
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
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
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
                <Ionicons name="add" size={32} color={Colors.white} />
              </View>
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