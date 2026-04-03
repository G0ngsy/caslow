import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';


import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingScreen from './src/screens/SettingScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1A0033', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8A2BE2" />
      </View>
    );
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
    // 기본 헤더 끄기
    headerShown: false,
    // 탭바 스타일
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