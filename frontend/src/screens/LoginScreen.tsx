import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';
import { registerPushToken } from '../lib/pushNotification';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    color: Colors.accentLight,
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textSub,
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
    color: Colors.textSub,
    fontSize: 14,
  },
});

export default function LoginScreen({ onNavigateSignup }: { onNavigateSignup?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (val: string) => {
    if (!val) return '';
    if (!EMAIL_REGEX.test(val)) return '올바른 이메일 형식이 아닙니다';
    return '';
  };

  const validatePassword = (val: string) => {
    if (!val) return '';
    if (val.length < 6) return '비밀번호는 6자 이상이어야 합니다';
    return '';
  };

  const handleLogin = async () => {
    const eErr = validateEmail(email) || (!email ? '이메일을 입력해주세요' : '');
    const pErr = validatePassword(password) || (!password ? '비밀번호를 입력해주세요' : '');
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않아요.');
      } else if (error.message.includes('Email not confirmed')) {
        Alert.alert('로그인 실패', '이메일 인증이 필요해요. 메일함을 확인해주세요.');
      } else if (error.message.includes('too many requests')) {
        Alert.alert('로그인 실패', '너무 많은 시도가 있었어요. 잠시 후 다시 시도해주세요.');
      } else {
        Alert.alert('로그인 실패', '로그인에 실패했어요. 다시 시도해주세요.');
      }
    } else {
      await registerPushToken();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Caslow</Text>
        <Text style={styles.subtitle}>나만의 AI 가계부</Text>

        <View style={styles.card}>
          <Input
            placeholder="이메일"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(validateEmail(t)); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
          <Input
            placeholder="비밀번호"
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(validatePassword(t)); }}
            secureTextEntry
            onSubmitEditing={handleLogin}
            error={passwordError}
          />
          <Button title={loading ? '로그인 중...' : '로그인'} onPress={handleLogin} />

          <TouchableOpacity style={styles.linkButton} onPress={onNavigateSignup}>
            <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
