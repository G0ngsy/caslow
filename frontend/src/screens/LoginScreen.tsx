import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';
import { registerPushToken } from '../lib/pushNotification';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,           // #1B1E3E
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: Colors.accentLight,            // #FAD493
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSub,                // #A3D8F1
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#1D3052',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#255DAA',
    boxShadow: '0px 0px 40px 10px rgba(37, 93, 170, 0.4)',
    shadowColor: '#255DAA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: Colors.textSub,                // #A3D8F1
    fontSize: 14,
  },
});

export default function LoginScreen({ onNavigateSignup }: { onNavigateSignup?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('로그인 실패', error.message);
    }else {
    // 로그인 성공 후 푸시 토큰 저장
    await registerPushToken();
  }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caslow</Text>
      <Text style={styles.subtitle}>나만의 AI 가계부</Text>

      <View style={styles.card}>
        <Input
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          onSubmitEditing={handleLogin} 
        />
        <Button title={loading ? '로그인 중...' : '로그인'} onPress={handleLogin} />

        <TouchableOpacity style={styles.linkButton} onPress={onNavigateSignup}>
          <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}