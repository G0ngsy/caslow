import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import Input from '../../components/Input';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'otp' | 'password' | 'done';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ visible, onClose }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!visible) {
      setStep('email');
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setCooldown(0);
    }
  }, [visible]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // 1단계: 이메일로 recovery OTP 발송
  const handleSendOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      setError('올바른 이메일 형식이 아닙니다');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed);
    setLoading(false);
    if (err) {
      if (err.status === 429) {
        setError('요청이 너무 많아요. 잠시 후 다시 시도해주세요.');
      } else {
        setError('메일 전송에 실패했어요. 다시 시도해주세요.');
      }
    } else {
      setCooldown(60);
      setStep('otp');
    }
  };

  // 2단계: OTP 코드 + 새 비밀번호로 검증 및 변경
  const handleVerifyAndReset = async () => {
    if (otp.trim().length < 1) {
      setError('이메일에서 받은 코드를 입력해주세요');
      return;
    }
    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    setLoading(true);
    setError('');

    // recovery OTP로 세션 획득
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'recovery',
    });

    if (verifyErr) {
      setLoading(false);
      setError('코드가 올바르지 않거나 만료됐어요. 다시 시도해주세요.');
      return;
    }

    // 비밀번호 변경
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });

    if (updateErr) {
      setLoading(false);
      setError('비밀번호 변경에 실패했어요. 다시 시도해주세요.');
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setStep('done');
  };

  const renderContent = () => {
    if (step === 'done') {
      return (
        <View style={styles.centeredBox}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={styles.doneTitle}>비밀번호 변경 완료!</Text>
          <Text style={styles.doneDesc}>새 비밀번호로 로그인해주세요.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>로그인하러 가기</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'otp') {
      return (
        <>
          <Text style={styles.desc}>
            <Text style={{ color: Colors.accentLight }}>{email}</Text>
            {'\n'}로 전송된 인증 코드와{'\n'}새 비밀번호를 입력해주세요.
          </Text>
          <Input
            placeholder="인증 코드 (이메일 확인)"
            value={otp}
            onChangeText={(t) => { setOtp(t); setError(''); }}
            keyboardType="numeric"
            error=""
          />
          <Input
            placeholder="새 비밀번호 (6자 이상)"
            value={newPassword}
            onChangeText={(t) => { setNewPassword(t); setError(''); }}
            secureTextEntry
            error=""
          />
          <Input
            placeholder="비밀번호 확인"
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
            secureTextEntry
            error={confirmPassword && newPassword !== confirmPassword ? '비밀번호가 일치하지 않습니다' : ''}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyAndReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>비밀번호 변경</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.resendButton} onPress={() => { setStep('email'); setOtp(''); setError(''); }} disabled={cooldown > 0}>
            <Text style={[styles.resendText, cooldown > 0 && { color: '#666' }]}>
              {cooldown > 0 ? `코드 재전송 (${cooldown}초)` : '← 이메일 다시 입력'}
            </Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <>
        <Text style={styles.desc}>가입한 이메일을 입력하면{'\n'}인증 코드를 보내드려요.</Text>
        <Input
          placeholder="이메일"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          error=""
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>인증 코드 받기</Text>}
        </TouchableOpacity>
      </>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.box}>
          <View style={styles.header}>
            <Text style={styles.title}>비밀번호 재설정</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>
          {renderContent()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  box: {
    backgroundColor: '#1D3052',
    borderRadius: 20,
    padding: 24,
    width: '88%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#255DAA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  close: {
    color: '#888',
    fontSize: 16,
  },
  desc: {
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4B6BFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 2,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 14,
  },
  resendText: {
    color: Colors.accentLight,
    fontSize: 13,
  },
  centeredBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  doneIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  doneTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  doneDesc: {
    color: Colors.textSub,
    fontSize: 14,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#4B6BFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginTop: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
