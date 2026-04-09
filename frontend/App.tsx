import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './src/screens/SplashScreen';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExpenseScreen from './src/screens/ExpenseScreen';
import ExpenseFormScreen from './src/screens/ExpenseFormScreen';
import ExpenseDetailScreen from './src/screens/ExpenseDetailScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingScreen from './src/screens/SettingScreen';
import TabBar from './src/components/TabBar';
import GoalScreen from './src/screens/GoalScreen';

const Tab = createBottomTabNavigator();
const ExpenseStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

// 홈 스택 네비게이터
// HomeScreen → ExpenseDetailScreen
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
    </HomeStack.Navigator>
  );
}

// 지출 스택 네비게이터
// ExpenseScreen → ExpenseFormScreen
function ExpenseStackNavigator() {
  return (
    <ExpenseStack.Navigator screenOptions={{ headerShown: false }}>
      <ExpenseStack.Screen name="ExpenseSelect" component={ExpenseScreen} />
      <ExpenseStack.Screen name="ExpenseForm" component={ExpenseFormScreen} />
    </ExpenseStack.Navigator>
  );
}

// 탭 네비게이터
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="홈" component={HomeStackNavigator} />
      <Tab.Screen name="분석" component={AnalysisScreen} />
      <Tab.Screen name="입력" component={ExpenseStackNavigator} />
      <Tab.Screen name="목표" component={GoalScreen} />
      <Tab.Screen name="설정" component={SettingScreen} />
    </Tab.Navigator>
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
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Tabs" component={TabNavigator} />
        <RootStack.Screen name="Chat" component={ChatScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}