import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,           // #1B1E3E
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
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
    fontSize: 25,
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

export default function SignupScreen({ onNavigateLogin }: { onNavigateLogin?: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('오류', '모든 항목을 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    setLoading(false);
    if (error) {
      Alert.alert('회원가입 실패', error.message);
    } else {
      Alert.alert('완료', '이메일을 확인해주세요!', [
        { text: '확인', onPress: onNavigateLogin }
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Caslow</Text>
      

      <View style={styles.card}>
        <Text style={styles.subtitle}>회원가입</Text>
        <Input
          placeholder="이름"
          value={name}
          onChangeText={setName}
        />
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
        />
        <Input
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Button title="회원가입" onPress={handleSignup} />

        <TouchableOpacity style={styles.linkButton} onPress={onNavigateLogin}>
          <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}