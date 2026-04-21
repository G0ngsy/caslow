import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';

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
    fontSize: 20,
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

export default function SignupScreen({ onNavigateLogin }: { onNavigateLogin?: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

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

  const validateConfirm = (val: string) => {
    if (!val) return '';
    if (val !== password) return '비밀번호가 일치하지 않습니다';
    return '';
  };

  const handleSignup = async () => {
    const nErr = !name ? '이름을 입력해주세요' : '';
    const eErr = validateEmail(email) || (!email ? '이메일을 입력해주세요' : '');
    const pErr = validatePassword(password) || (!password ? '비밀번호를 입력해주세요' : '');
    const cErr = validateConfirm(confirmPassword) || (!confirmPassword ? '비밀번호 확인을 입력해주세요' : '');

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmError(cErr);
    if (nErr || eErr || pErr || cErr) return;

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        Alert.alert('회원가입 실패', '이미 사용 중인 이메일입니다.');
      } else if (error.message.includes('invalid')) {
        Alert.alert('회원가입 실패', '이메일 형식이 올바르지 않습니다.');
      } else {
        Alert.alert('회원가입 실패', '회원가입에 실패했어요. 다시 시도해주세요.');
      }
    } else {
      Alert.alert('완료', '이메일을 확인해주세요!', [
        { text: '확인', onPress: onNavigateLogin }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Caslow</Text>

        <View style={styles.card}>
          <Text style={styles.subtitle}>회원가입</Text>
          <Input
            placeholder="이름"
            value={name}
            onChangeText={(t) => { setName(t); setNameError(''); }}
            error={nameError}
          />
          <Input
            placeholder="이메일"
            value={email}
            onChangeText={(t) => { setEmail(t); setEmailError(validateEmail(t)); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />
          <Input
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChangeText={(t) => { setPassword(t); setPasswordError(validatePassword(t)); }}
            secureTextEntry
            error={passwordError}
          />
          <Input
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setConfirmError(t !== password ? '비밀번호가 일치하지 않습니다' : ''); }}
            secureTextEntry
            error={confirmError}
          />
          <Button title={loading ? '가입 중...' : '회원가입'} onPress={handleSignup} />

          <TouchableOpacity style={styles.linkButton} onPress={onNavigateLogin}>
            <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
