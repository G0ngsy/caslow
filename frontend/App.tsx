import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';

import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import ExpenseFormScreen from './src/screens/ExpenseFormScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingScreen from './src/screens/SettingScreen';

const Tab = createBottomTabNavigator();
const ExpenseStack = createNativeStackNavigator();

// 지출 스택 네비게이터
// ExpenseScreen (선택화면) → ExpenseFormScreen (입력폼)
function ExpenseStackNavigator() {
  return (
    <ExpenseStack.Navigator screenOptions={{ headerShown: false }}>
      <ExpenseStack.Screen name="ExpenseSelect" component={ExpenseScreen} />
      <ExpenseStack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
    </ExpenseStack.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return <SplashScreen />;
  }

  if (!session) {
    return showSignup
      ? <SignupScreen onNavigateLogin={() => setShowSignup(false)} />
      : <LoginScreen onNavigateSignup={() => setShowSignup(true)} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={() => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1A0033',
            borderTopColor: '#A14EFF',
          },
          tabBarActiveTintColor: '#D1A3FF',
          tabBarInactiveTintColor: '#A14EFF',
        })}
      >
        <Tab.Screen name="홈" component={HomeScreen}
          options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
        
        {/* 지출 탭은 Stack Navigator 사용 */}
        <Tab.Screen name="지출" component={ExpenseStackNavigator}
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