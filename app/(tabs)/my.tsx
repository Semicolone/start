import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { authApi, homeApi, myApi } from '../../lib/client';

type MyData = {
  name: string;
  email: string;
  totalQuestions: number;
  activeDays: number;
  aiToolCount: number;
};

export default function MyScreen() {
  const [myData, setMyData] = useState<MyData>({
    name: '사용자',
    email: '',
    totalQuestions: 0,
    activeDays: 0,
    aiToolCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMyData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const profile = await myApi.getProfile();
      const home = await homeApi.getHome();

      const name =
        profile?.username ||
        profile?.name ||
        home?.username ||
        home?.name ||
        profile?.email?.split('@')?.[0] ||
        '사용자';

      setMyData({
        name,
        email: profile?.email || '',
        totalQuestions:
          home?.total_insights ??
          home?.totalQuestions ??
          home?.total_questions ??
          0,
        activeDays:
          home?.active_days ??
          home?.activeDays ??
          home?.monthly_active_days ??
          0,
        aiToolCount:
          home?.ai_tool_count ??
          home?.aiToolCount ??
          home?.used_ai_tool_count ??
          0,
      });
    } catch (error: any) {
      console.log('마이페이지 불러오기 실패:', error);
      setErrorMessage(error?.message || '마이페이지 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setErrorMessage('');

      await authApi.logout();

      setLogoutModalVisible(false);
      router.replace('/login');
    } catch (error: any) {
      setErrorMessage(error?.message || '로그아웃 중 오류가 발생했습니다.');
      setLogoutModalVisible(false);
    } finally {
      setLoggingOut(false);
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
      console.log('회원탈퇴 실패:', error);
      setErrorMessage(error?.message || '회원 탈퇴 중 오류가 발생했습니다.');
      setDeleteModalVisible(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyData();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.outer}>
        <View style={styles.phoneLikeContainer}>
          <View style={styles.topbar}>
            <View>
              <Text style={styles.title}>마이페이지</Text>
              <Text style={styles.subtitle}>내 기록과 계정 정보를 확인해요</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#2d6a4f" />
                <Text style={styles.loadingText}>마이페이지를 불러오는 중이에요...</Text>
              </View>
            ) : (
              <>
                <View style={styles.profileCard}>
                  <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(myData.name || '사').slice(0, 1)}
                      </Text>
                    </View>

                    <View style={styles.avatarEdit}>
                      <Ionicons name="pencil" size={10} color="#ffffff" />
                    </View>
                  </View>

                  <Text style={styles.profileName}>{myData.name}</Text>
                  <Text style={styles.profileEmail}>
                    {myData.email || '이메일 정보 없음'}
                  </Text>

                  <Pressable style={styles.accountLink} onPress={() => router.push('/account')}>
                    <Ionicons name="settings-outline" size={13} color="#2d6a4f" />
                    <Text style={styles.accountLinkText}>계정 관리</Text>
                  </Pressable>

                  <View style={styles.profileStats}>
                    <View style={styles.profileStat}>
                      <Text style={styles.profileStatNumber}>
                        {myData.totalQuestions}
                      </Text>
                      <Text style={styles.profileStatLabel}>총 질문</Text>
                    </View>

                    <View style={styles.profileStat}>
                      <Text style={styles.profileStatNumber}>
                        {myData.activeDays}
                      </Text>
                      <Text style={styles.profileStatLabel}>활동일</Text>
                    </View>

                    <View style={styles.profileStat}>
                      <Text style={styles.profileStatNumber}>
                        {myData.aiToolCount}
                      </Text>
                      <Text style={styles.profileStatLabel}>AI 툴</Text>
                    </View>
                  </View>
                </View>

                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}

                <Text style={styles.sectionLabel}>나의 분석</Text>

                <View style={styles.emptyAnalysisCard}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="analytics-outline" size={24} color="#9ca3af" />
                  </View>

                  <Text style={styles.emptyAnalysisTitle}>성향 분석</Text>

                  <Text style={styles.emptyAnalysisSub}>
                    사용자의 질문 데이터가 충분히 쌓이면 관심 분야, 질문 스타일,
                    AI 사용 패턴을 분석해 보여줄 예정입니다.
                  </Text>

                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>추후 개발 예정</Text>
                  </View>
                </View>

                <Pressable
                  style={styles.retroCard}
                  onPress={() => router.push('/monthly-review')}
                >
                  <View style={styles.retroTop}>
                    <Text style={styles.retroMonth}>월간 회고</Text>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </View>

                  <Text style={styles.retroTitle}>
                    이번 달 질문 흐름을 요약해드릴게요
                  </Text>
                  <Text style={styles.retroBody} numberOfLines={2}>
                    MVP 이후 사용자의 질문 주제 변화, 많이 사용한 AI 툴,
                    자주 등장한 키워드를 기반으로 월간 회고를 보여줄 예정입니다.
                  </Text>

                  <View style={styles.retroStats}>
                    <View style={styles.retroStat}>
                      <Text style={styles.retroStatNumber}>
                        {myData.totalQuestions}
                      </Text>
                      <Text style={styles.retroStatLabel}>총 질문</Text>
                    </View>

                    <View style={styles.retroStat}>
                      <Text style={styles.retroStatNumber}>
                        {myData.activeDays}
                      </Text>
                      <Text style={styles.retroStatLabel}>활동일</Text>
                    </View>

                    <View style={styles.retroStat}>
                      <Text style={styles.retroStatNumber}>-</Text>
                      <Text style={styles.retroStatLabel}>최다 질문</Text>
                    </View>
                  </View>
                </Pressable>

                <View style={styles.settingCard}>
                  <Pressable
                    style={styles.settingRow}
                    onPress={() => setLogoutModalVisible(true)}
                    disabled={loggingOut}
                  >
                    <View style={styles.settingLeft}>
                      <Ionicons name="log-out-outline" size={18} color="#d45d79" />
                      <Text style={[styles.settingText, { color: '#d45d79' }]}>
                        {loggingOut ? '로그아웃 중...' : '로그아웃'}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </Pressable>

                  <Pressable
                    style={styles.settingRowLast}
                    onPress={() => setDeleteModalVisible(true)}
                    disabled={deletingAccount}
                  >
                    <View style={styles.settingLeft}>
                      <Ionicons
                        name="person-remove-outline"
                        size={18}
                        color="#991b1b"
                      />
                      <Text style={[styles.settingText, { color: '#991b1b' }]}>
                        {deletingAccount ? '탈퇴 처리 중...' : '회원 탈퇴'}
                      </Text>
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>

          <Modal
            visible={logoutModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setLogoutModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <View style={styles.modalGreenIcon}>
                  <Ionicons name="log-out-outline" size={26} color="#2d6a4f" />
                </View>

                <Text style={styles.modalTitle}>로그아웃할까요?</Text>
                <Text style={styles.modalDesc}>
                  다시 이용하려면 로그인해야 해요.
                </Text>

                <View style={styles.modalButtonRow}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => setLogoutModalVisible(false)}
                    disabled={loggingOut}
                  >
                    <Text style={styles.modalCancelText}>취소</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalConfirmButton}
                    onPress={handleLogout}
                    disabled={loggingOut}
                  >
                    {loggingOut ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.modalConfirmText}>로그아웃</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

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
    </View>
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
    backgroundColor: '#f5f4f0',
  },

  topbar: {
    backgroundColor: '#ffffff',
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e0',
  },

  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1a1a18',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 12,
    paddingBottom: 100,
  },

  loadingBox: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },

  profileCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarWrap: {
    width: 56,
    height: 56,
    marginBottom: 9,
    position: 'relative',
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a4a35',
  },

  avatarEdit: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a18',
  },

  profileEmail: {
    marginTop: 3,
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },

  accountLink: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  accountLinkText: {
    fontSize: 11,
    color: '#2d6a4f',
    fontWeight: '800',
  },

  profileStats: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#e8e6e0',
    flexDirection: 'row',
    width: '100%',
  },

  profileStat: {
    flex: 1,
    alignItems: 'center',
  },

  profileStatNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1a1a18',
  },

  profileStatLabel: {
    marginTop: 2,
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '700',
  },

  errorText: {
    fontSize: 11,
    color: '#d45d79',
    fontWeight: '800',
    marginBottom: 10,
    backgroundColor: '#fceeef',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 2,
  },

  emptyAnalysisCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 13,
    paddingVertical: 26,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 10,
  },

  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#f5f4f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyAnalysisTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1a18',
    marginBottom: 6,
  },

  emptyAnalysisSub: {
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 17,
    textAlign: 'center',
  },

  comingSoonBadge: {
    marginTop: 12,
    backgroundColor: '#e8f5ee',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },

  comingSoonText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1a4a35',
  },

  retroCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 13,
    padding: 12,
    marginBottom: 10,
  },

  retroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  retroMonth: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  retroTitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#1a1a18',
    fontWeight: '900',
    lineHeight: 18,
  },

  retroBody: {
    marginTop: 5,
    fontSize: 11,
    color: '#6b7280',
    lineHeight: 17,
  },

  retroStats: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8e6e0',
    flexDirection: 'row',
  },

  retroStat: {
    flex: 1,
    alignItems: 'center',
  },

  retroStatNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a18',
  },

  retroStatLabel: {
    marginTop: 2,
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '700',
  },

  settingCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e6e0',
    borderRadius: 13,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  settingRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e6e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingRowLast: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  settingText: {
    fontSize: 13,
    fontWeight: '800',
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

  modalGreenIcon: {
    width: 54,
    height: 54,
    borderRadius: 999,
    backgroundColor: '#e8f5ee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
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

  modalConfirmButton: {
    flex: 1,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#2d6a4f',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalConfirmText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
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