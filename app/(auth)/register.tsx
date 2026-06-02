import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authApi } from '../../lib/client';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !passwordCheck.trim()) {
      setErrorMessage('모든 항목을 입력해주세요.');
      setSuccessMessage('');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상 입력해주세요.');
      setSuccessMessage('');
      return;
    }

    if (password !== passwordCheck) {
      setErrorMessage('비밀번호가 서로 일치하지 않습니다.');
      setSuccessMessage('');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      setSuccessMessage('회원가입이 완료되었습니다. 로그인해주세요.');

      setTimeout(() => {
        router.replace('/login');
      }, 700);
    } catch (error: any) {
      setErrorMessage(error?.message || '회원가입 중 오류가 발생했습니다.');
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.outer}>
        <View style={styles.phoneLikeContainer}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.replace('/login')}>
              <Ionicons name="arrow-back" size={22} color="#6b7280" />
            </Pressable>

            <Text style={styles.headerTitle}>회원가입</Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              placeholder="이름을 입력하세요"
              placeholderTextColor="#8b8b8b"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrorMessage('');
                setSuccessMessage('');
              }}
            />

            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#8b8b8b"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              placeholder="8자 이상 입력하세요"
              placeholderTextColor="#8b8b8b"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              secureTextEntry
            />

            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              placeholderTextColor="#8b8b8b"
              value={passwordCheck}
              onChangeText={(text) => {
                setPasswordCheck(text);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              secureTextEntry
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {successMessage ? (
              <Text style={styles.successText}>{successMessage}</Text>
            ) : null}

            <Pressable
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>가입하기</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.loginText}>
                이미 계정이 있으신가요?{' '}
                <Text style={styles.loginStrong}>로그인</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e8e4dc',
  },

  outer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e4dc',
  },

  phoneLikeContainer: {
    width: '100%',
    maxWidth: 360,
    height: '100%',
    minHeight: 640,
    backgroundColor: '#ffffff',
  },

  header: {
    height: 92,
    paddingTop: 34,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e0',
    backgroundColor: '#ffffff',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#ffffff',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a18',
  },

  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 40,
  },

  label: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1cec8',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a18',
    marginBottom: 10,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  errorText: {
    marginTop: 10,
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },

  successText: {
    marginTop: 10,
    color: '#1F7A4D',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 19,
  },

  registerButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 26,
  },

  disabledButton: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },

  loginText: {
    marginTop: 22,
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },

  loginStrong: {
    color: '#2d6a4f',
    fontWeight: '800',
  },
});