import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingScreen from './src/screens/SettingScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="홈" component={HomeScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
        <Tab.Screen name="지출" component={ExpenseScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} /> }} />
        <Tab.Screen name="분석" component={AnalysisScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} /> }} />
        <Tab.Screen name="AI" component={ChatScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" size={size} color={color} /> }} />
        <Tab.Screen name="설정" component={SettingScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} /> }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}