import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { authApi, myApi } from '../lib/client';

export default function AccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordCheck, setNewPasswordCheck] = useState('');

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setMessage('');
      setErrorMessage('');
      setPasswordMessage('');
      setPasswordError('');

      const data = await myApi.getProfile();

      const username =
        data?.username ||
        data?.name ||
        data?.email?.split('@')?.[0] ||
        '사용자';

      setName(username);
      setEmail(data?.email || '');
    } catch (error: any) {
      setErrorMessage(error?.message || '계정 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setErrorMessage('이름을 입력해주세요.');
      setMessage('');
      return;
    }

    try {
      setSavingProfile(true);
      setMessage('');
      setErrorMessage('');

      const updated = await myApi.updateProfile({
        username: name.trim(),
      });

      setName(updated?.username || name.trim());
      setMessage('프로필 수정이 완료되었습니다.');
    } catch (error: any) {
      setErrorMessage(error?.message || '프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage('');
    setPasswordError('');
    setMessage('');
    setErrorMessage('');

    if (!currentPassword.trim()) {
      setPasswordError('현재 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (!newPasswordCheck.trim()) {
      setPasswordError('새 비밀번호 확인을 입력해주세요.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('새 비밀번호는 8자 이상 입력해주세요.');
      return;
    }

    if (newPassword !== newPasswordCheck) {
      setPasswordError('새 비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    try {
      setChangingPassword(true);

      await myApi.changePassword({
        currentPassword,
        newPassword,
        current_password: currentPassword,
        new_password: newPassword,
      } as any);

      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordCheck('');

      setPasswordMessage('비밀번호 변경이 완료되었습니다.');
      setPasswordError('');
    } catch (error: any) {
      console.log('비밀번호 변경 실패:', error);

      const rawMessage = String(error?.message || '');

      if (rawMessage.includes('Failed to fetch')) {
        setPasswordError(
          '서버에 연결하지 못했습니다. 배포 서버/API 상태를 확인해주세요.'
        );
        return;
      }

      if (
        rawMessage.includes('현재') ||
        rawMessage.includes('비밀번호') ||
        rawMessage.toLowerCase().includes('password') ||
        rawMessage.toLowerCase().includes('incorrect') ||
        rawMessage.toLowerCase().includes('invalid') ||
        rawMessage.includes('401') ||
        rawMessage.includes('403')
      ) {
        setPasswordError('현재 비밀번호가 올바르지 않습니다.');
        return;
      }

      setPasswordError(rawMessage || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeletingAccount(true);
      setErrorMessage('');

      await myApi.deleteAccount();
      await authApi.logout();

      setDeleteModalVisible(false);
      router.replace('/login');
    } catch (error: any) {
      setErrorMessage(error?.message || '회원 탈퇴 중 오류가 발생했습니다.');
      setDeleteModalVisible(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.outer}>
        <View style={styles.phoneLikeContainer}>
          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={21} color="#6b7280" />
            </Pressable>

            <Text style={styles.headerTitle}>계정 관리</Text>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2d6a4f" />
              <Text style={styles.loadingText}>계정 정보를 불러오는 중이에요...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.profilePreview}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(name || '사').slice(0, 1)}
                  </Text>
                </View>

                <Text style={styles.previewName}>{name || '사용자'}</Text>
                <Text style={styles.previewEmail}>
                  {email || '이메일 정보 없음'}
                </Text>
              </View>

              {message ? <Text style={styles.successText}>{message}</Text> : null}
              {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

              <Text style={styles.sectionLabel}>정보 수정</Text>

              <Text style={styles.label}>이름</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setMessage('');
                  setErrorMessage('');
                }}
                placeholder="이름을 입력하세요"
                placeholderTextColor="#9ca3af"
              />

              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                placeholder="이메일을 입력하세요"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  savingProfile && styles.disabledButton,
                ]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>저장하기</Text>
                )}
              </Pressable>

              <Text style={styles.sectionLabel}>비밀번호 변경</Text>

              <Text style={styles.label}>현재 비밀번호</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  setPasswordMessage('');
                  setPasswordError('');
                }}
                placeholder="현재 비밀번호"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />

              <Text style={styles.label}>새 비밀번호</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setPasswordMessage('');
                  setPasswordError('');
                }}
                placeholder="8자 이상"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />

              <Text style={styles.label}>새 비밀번호 확인</Text>
              <TextInput
                style={styles.input}
                value={newPasswordCheck}
                onChangeText={(text) => {
                  setNewPasswordCheck(text);
                  setPasswordMessage('');
                  setPasswordError('');
                }}
                placeholder="비밀번호 재입력"
                placeholderTextColor="#9ca3af"
                secureTextEntry
              />

              {passwordError ? (
                <Text style={styles.passwordErrorText}>{passwordError}</Text>
              ) : null}

              {passwordMessage ? (
                <Text style={styles.passwordSuccessText}>{passwordMessage}</Text>
              ) : null}

              <Pressable
                style={[
                  styles.primaryButton,
                  changingPassword && styles.disabledButton,
                ]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>변경하기</Text>
                )}
              </Pressable>

              <View style={styles.dangerCard}>
                <Pressable
                  style={styles.dangerRow}
                  onPress={() => setDeleteModalVisible(true)}
                  disabled={deletingAccount}
                >
                  <View style={styles.dangerLeft}>
                    <Ionicons
                      name="person-remove-outline"
                      size={18}
                      color="#991b1b"
                    />
                    <Text style={styles.dangerText}>
                      {deletingAccount ? '탈퇴 처리 중...' : '회원 탈퇴'}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </Pressable>
              </View>
            </ScrollView>
          )}

          <Modal
            visible={deleteModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setDeleteModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <View style={styles.modalRedIcon}>
                  <Ionicons name="person-remove-outline" size={26} color="#e53935" />
                </View>

                <Text style={styles.modalTitle}>회원 탈퇴할까요?</Text>
                <Text style={styles.modalDesc}>
                  계정과 저장된 데이터가 삭제될 수 있어요. 이 작업은 되돌릴 수 없습니다.
                </Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setDeleteModalVisible(false)}
                    disabled={deletingAccount}
                  >
                    <Text style={styles.modalCancelText}>취소</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalDeleteButton}
                    onPress={handleDeleteAccount}
                    disabled={deletingAccount}
                  >
                    {deletingAccount ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.modalDeleteText}>탈퇴</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e0',
    backgroundColor: '#ffffff',
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e6e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#ffffff',
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1a1a18',
  },

  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  scroll: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  content: {
    padding: 12,
    paddingBottom: 40,
  },

  profilePreview: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a4a35',
  },

  previewName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a18',
  },

  previewEmail: {
    marginTop: 3,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  successText: {
    fontSize: 12,
    color: '#2d6a4f',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },

  errorText: {
    fontSize: 12,
    color: '#d45d79',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },

  passwordErrorText: {
    fontSize: 12,
    color: '#d45d79',
    fontWeight: '800',
    marginTop: -2,
    marginBottom: 8,
    lineHeight: 18,
  },

  passwordSuccessText: {
    fontSize: 12,
    color: '#2d6a4f',
    fontWeight: '800',
    marginTop: -2,
    marginBottom: 8,
    lineHeight: 18,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 8,
  },

  label: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 8,
  },

  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1cec8',
    borderRadius: 11,
    paddingHorizontal: 13,
    fontSize: 14,
    color: '#1a1a18',
    marginBottom: 8,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  disabledInput: {
    backgroundColor: '#f5f4f0',
    color: '#6b7280',
  },

  primaryButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  dangerCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 13,
    paddingHorizontal: 12,
    marginTop: 4,
  },

  dangerRow: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dangerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  dangerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991b1b',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  modalBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  modalRedIcon: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#fff0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
  },

  modalDesc: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },

  modalButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },

  modalCancelButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#d1cec8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#374151',
  },

  modalDeleteButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalDeleteText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
});