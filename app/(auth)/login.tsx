import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authApi } from '../../lib/client';

const logoLeaf = require('../../assets/images/logo_leaf.png');
const bottomImage = require('../../assets/images/bottom.png');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      await authApi.login({
        email: email.trim(),
        password,
      });

      router.replace('/home');
    } catch (error: any) {
      setErrorMessage(
        error?.message || '이메일 또는 비밀번호가 올바르지 않습니다.'
      );
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
        <View style={styles.phone}>
          <Image source={bottomImage} style={styles.bottomImage} resizeMode="cover" />

          <View style={styles.content}>
            <View style={styles.logoArea}>
              <View style={styles.logoRow}>
                <Image source={logoLeaf} style={styles.logoLeaf} resizeMode="contain" />
                <Text style={styles.logoText}>FLOW</Text>
              </View>

              <Text style={styles.subtitle}>AI 질문 기록으로 나를 발견해요</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>이메일</Text>

              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="이메일을 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMessage('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.label}>비밀번호</Text>

              <View style={styles.inputBox}>
                <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage('');
                  }}
                  secureTextEntry
                />
                <Ionicons name="eye-off-outline" size={16} color="#9CA3AF" />
              </View>

              {errorMessage ? (
                <Text style={styles.errorText}>{errorMessage}</Text>
              ) : null}

              <Pressable
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginButtonText}>로그인</Text>
                )}
              </Pressable>

              <Pressable onPress={() => router.push('/register')}>
                <Text style={styles.registerText}>
                  계정이 없으신가요?{' '}
                  <Text style={styles.registerStrong}>회원가입</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EAE5DA',
  },

  outer: {
    flex: 1,
    backgroundColor: '#EAE5DA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  phone: {
    width: '100%',
    maxWidth: 360,
    height: '100%',
    minHeight: 640,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },

  content: {
    flex: 1,
    paddingHorizontal: 34,
    justifyContent: 'center',
    paddingBottom: 52,
    zIndex: 5,
  },

  logoArea: {
    alignItems: 'center',
    marginBottom: 46,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoLeaf: {
    width: 38,
    height: 38,
    marginRight: 8,
  },

  logoText: {
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 2.2,
    color: '#1F5F3F',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 12,
    color: '#8B929C',
    fontWeight: '600',
  },

  form: {
    width: '100%',
  },

  label: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3F454D',
    marginBottom: 7,
    marginTop: 14,
  },

  inputBox: {
    height: 45,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E3DED6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    shadowColor: '#000000',
    shadowOpacity: 0.025,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },

  input: {
    flex: 1,
    height: '100%',
    marginLeft: 9,
    fontSize: 13,
    color: '#222222',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  errorText: {
    marginTop: 10,
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },

  loginButton: {
    marginTop: 24,
    height: 50,
    borderRadius: 9,
    backgroundColor: '#1F5F3F',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F5F3F',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },

  disabledButton: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  registerText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#737B86',
    fontSize: 13,
    fontWeight: '600',
  },

  registerStrong: {
    color: '#1F5F3F',
    fontWeight: '900',
  },

  bottomImage: {
    position: 'absolute',
    left: -5,
    bottom: -3,
    width: 370,
    height: 145,
    opacity: 0.7,
    zIndex: 1,
  },
});