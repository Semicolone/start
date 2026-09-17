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

import {
  authApi,
  homeApi,
  myApi,
} from '../../lib/client';

type MyData = {
  name: string;
  email: string;

  totalInsights: number;
  activeDays: number;
  aiToolCount: number;
  categoryCount: number;
};

export default function MyScreen() {
  const [myData, setMyData] =
    useState<MyData>({
      name: '사용자',
      email: '',

      totalInsights: 0,
      activeDays: 0,
      aiToolCount: 0,
      categoryCount: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  const [
    logoutModalVisible,
    setLogoutModalVisible,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('');

  /* =========================================================
     마이페이지 데이터
  ========================================================= */

  const fetchMyData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const profile =
        await myApi.getProfile();

      const home =
        await homeApi.getHome();

      const name =
        profile?.username ||
        profile?.name ||
        home?.username ||
        home?.name ||
        profile?.email
          ?.split('@')
          ?.[0] ||
        '사용자';

      /*
       * Home API의 카테고리 분포에서
       * 실제 존재하는 카테고리 개수 계산
       */
      const categoryDistribution =
        Array.isArray(
          home?.category_distribution
        )
          ? home.category_distribution
          : [];

      const categoryCount =
        categoryDistribution.filter(
          (item: any) => {
            /*
             * count 값이 있는 경우
             * 1개 이상인 카테고리만 계산
             */
            if (
              item?.count !== undefined
            ) {
              return (
                Number(item.count) > 0
              );
            }

            /*
             * API가 percent만 보내는 경우
             */
            if (
              item?.percent !== undefined
            ) {
              return (
                Number(
                  item.percent
                ) > 0
              );
            }

            /*
             * 배열에 존재한다면
             * 카테고리 하나로 취급
             */
            return true;
          }
        ).length;

      setMyData({
        name,

        email:
          profile?.email || '',

        totalInsights:
          home?.total_insights ??
          home?.totalQuestions ??
          home?.total_questions ??
          0,

        activeDays:
          home?.active_days ??
          home?.activeDays ??
          home?.monthly_active_days ??
          home?.this_month_active_days ??
          0,

        aiToolCount:
          home?.ai_tool_count ??
          home?.aiToolCount ??
          home?.used_ai_tool_count ??
          home?.ai_source_count ??
          0,

        categoryCount,
      });
    } catch (error: any) {
      console.log(
        '마이페이지 불러오기 실패:',
        error
      );

      setErrorMessage(
        error?.message ||
          '마이페이지 정보를 불러오지 못했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     로그아웃
  ========================================================= */

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      setErrorMessage('');

      await authApi.logout();

      setLogoutModalVisible(
        false
      );

      router.replace('/login');
    } catch (error: any) {
      console.log(
        '로그아웃 실패:',
        error
      );

      setErrorMessage(
        error?.message ||
          '로그아웃 중 오류가 발생했습니다.'
      );

      setLogoutModalVisible(
        false
      );
    } finally {
      setLoggingOut(false);
    }
  };

  /* =========================================================
     마이페이지 진입 시 데이터 새로고침
  ========================================================= */

  useFocusEffect(
    useCallback(() => {
      fetchMyData();
    }, [])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.outer}>
        <View
          style={
            styles.phoneLikeContainer
          }
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View style={styles.topbar}>
            <Text style={styles.title}>
              마이페이지
            </Text>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            {loading ? (
              <View
                style={
                  styles.loadingBox
                }
              >
                <ActivityIndicator
                  color="#2D6A4F"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  마이페이지를 불러오는 중이에요...
                </Text>
              </View>
            ) : (
              <>
                {/* =================================================
                    PROFILE
                ================================================= */}

                <View
                  style={
                    styles.profileCard
                  }
                >
                  <View
                    style={
                      styles.profileLeft
                    }
                  >
                    {/* 프로필 아이콘 */}

                    <View
                      style={
                        styles.avatar
                      }
                    >
                      <Text
                        style={
                          styles.avatarText
                        }
                      >
                        {(myData.name ||
                          '사'
                        ).slice(
                          0,
                          1
                        )}
                      </Text>
                    </View>

                    {/* 이름 / 이메일 / 계정 관리 */}

                    <View
                      style={
                        styles.profileTextArea
                      }
                    >
                      <Text
                        style={
                          styles.profileName
                        }
                      >
                        {myData.name}
                      </Text>

                      <Text
                        style={
                          styles.profileEmail
                        }
                      >
                        {myData.email ||
                          '이메일 정보 없음'}
                      </Text>

                      {/* 계정 관리 */}

                      <Pressable
                        style={
                          styles.accountLink
                        }
                        onPress={() =>
                          router.push(
                            '/account'
                          )
                        }
                      >
                        <Ionicons
                          name="settings-outline"
                          size={13}
                          color="#2D6A4F"
                        />

                        <Text
                          style={
                            styles.accountLinkText
                          }
                        >
                          계정 관리
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {/* =================================================
                    통계 3개
                ================================================= */}

                <View
                  style={
                    styles.statsRow
                  }
                >
                  {/* 인사이트 */}

                  <View
                    style={
                      styles.statCard
                    }
                  >
                    <Text
                      style={
                        styles.statNumber
                      }
                    >
                      {
                        myData.totalInsights
                      }
                    </Text>

                    <Text
                      style={
                        styles.statLabel
                      }
                    >
                      인사이트
                    </Text>
                  </View>

                  {/* 활동일 */}

                  <View
                    style={
                      styles.statCard
                    }
                  >
                    <Text
                      style={
                        styles.statNumber
                      }
                    >
                      {
                        myData.activeDays
                      }
                    </Text>

                    <Text
                      style={
                        styles.statLabel
                      }
                    >
                      활동일
                    </Text>
                  </View>

                  {/* 카테고리 */}

                  <View
                    style={
                      styles.statCard
                    }
                  >
                    <Text
                      style={
                        styles.statNumber
                      }
                    >
                      {
                        myData.categoryCount
                      }
                    </Text>

                    <Text
                      style={
                        styles.statLabel
                      }
                    >
                      카테고리
                    </Text>
                  </View>
                </View>

                {/* =================================================
                    API 오류
                ================================================= */}

                {errorMessage ? (
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {errorMessage}
                  </Text>
                ) : null}

                {/* =================================================
                    설정 메뉴
                ================================================= */}

                <View
                  style={
                    styles.menuCard
                  }
                >
                  {/* 알림 설정 */}

                  <Pressable
                    style={
                      styles.menuRow
                    }
                  >
                    <Text
                      style={
                        styles.menuText
                      }
                    >
                      알림 설정
                    </Text>

                    <View
                      style={
                        styles.menuRight
                      }
                    >
                      <Text
                        style={
                          styles.menuValue
                        }
                      >
                        켜짐
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#C4C2BB"
                      />
                    </View>
                  </Pressable>

                  {/* 연결된 AI 도구 */}

                  <Pressable
                    style={
                      styles.menuRow
                    }
                  >
                    <Text
                      style={
                        styles.menuText
                      }
                    >
                      연결된 AI 도구
                    </Text>

                    <View
                      style={
                        styles.menuRight
                      }
                    >
                      <Text
                        style={
                          styles.menuValue
                        }
                      >
                        {
                          myData.aiToolCount
                        }
                        개
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color="#C4C2BB"
                      />
                    </View>
                  </Pressable>

                  {/* 카테고리 관리 */}

                  <Pressable
                    style={
                      styles.menuRow
                    }
                    onPress={() =>
                      router.push(
                        '/explore?tab=category'
                      )
                    }
                  >
                    <Text
                      style={
                        styles.menuText
                      }
                    >
                      카테고리 관리
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color="#C4C2BB"
                    />
                  </Pressable>

                  {/* =================================================
                      고객센터

                      app/support.tsx로 이동
                  ================================================= */}

                  <Pressable
                    style={
                      styles.menuRowLast
                    }
                    onPress={() =>
                      router.push(
                        '/support'
                      )
                    }
                  >
                    <Text
                      style={
                        styles.menuText
                      }
                    >
                      고객센터
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color="#C4C2BB"
                    />
                  </Pressable>
                </View>

                {/* =================================================
                    로그아웃
                ================================================= */}

                <View
                  style={
                    styles.settingCard
                  }
                >
                  <Pressable
                    style={
                      styles.settingRowLast
                    }
                    onPress={() =>
                      setLogoutModalVisible(
                        true
                      )
                    }
                    disabled={
                      loggingOut
                    }
                  >
                    <View
                      style={
                        styles.settingLeft
                      }
                    >
                      <Ionicons
                        name="log-out-outline"
                        size={18}
                        color="#D45D79"
                      />

                      <Text
                        style={[
                          styles.settingText,
                          {
                            color:
                              '#D45D79',
                          },
                        ]}
                      >
                        {loggingOut
                          ? '로그아웃 중...'
                          : '로그아웃'}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#9CA3AF"
                    />
                  </Pressable>
                </View>
              </>
            )}
          </ScrollView>

          {/* =================================================
              로그아웃 확인 모달
          ================================================= */}

          <Modal
            visible={
              logoutModalVisible
            }
            transparent
            animationType="fade"
            onRequestClose={() =>
              setLogoutModalVisible(
                false
              )
            }
          >
            <View
              style={
                styles.modalOverlay
              }
            >
              <View
                style={
                  styles.modalBox
                }
              >
                <View
                  style={
                    styles.modalGreenIcon
                  }
                >
                  <Ionicons
                    name="log-out-outline"
                    size={26}
                    color="#2D6A4F"
                  />
                </View>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  로그아웃할까요?
                </Text>

                <Text
                  style={
                    styles.modalDesc
                  }
                >
                  다시 이용하려면 로그인해야 해요.
                </Text>

                <View
                  style={
                    styles.modalButtonRow
                  }
                >
                  {/* 취소 */}

                  <Pressable
                    style={
                      styles.modalCancelButton
                    }
                    onPress={() =>
                      setLogoutModalVisible(
                        false
                      )
                    }
                    disabled={
                      loggingOut
                    }
                  >
                    <Text
                      style={
                        styles.modalCancelText
                      }
                    >
                      취소
                    </Text>
                  </Pressable>

                  {/* 로그아웃 */}

                  <Pressable
                    style={
                      styles.modalConfirmButton
                    }
                    onPress={
                      handleLogout
                    }
                    disabled={
                      loggingOut
                    }
                  >
                    {loggingOut ? (
                      <ActivityIndicator
                        color="#FFFFFF"
                      />
                    ) : (
                      <Text
                        style={
                          styles.modalConfirmText
                        }
                      >
                        로그아웃
                      </Text>
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

/* =========================================================
   STYLE
========================================================= */

const styles = StyleSheet.create({
  /* =====================================================
     전체
  ===================================================== */

  screen: {
    flex: 1,

    backgroundColor: '#EAE5DA',
  },

  outer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#EAE5DA',
  },

  phoneLikeContainer: {
    width: '100%',

    maxWidth: 360,

    height: '100%',

    minHeight: 640,

    backgroundColor: '#F7F6F1',
  },

  /* =====================================================
     HEADER
  ===================================================== */

  topbar: {
    paddingTop: 47,

    paddingHorizontal: 18,

    paddingBottom: 14,

    backgroundColor: '#F7F6F1',
  },

  title: {
    fontSize: 22,

    fontWeight: '900',

    color: '#1A1A18',

    letterSpacing: -0.4,
  },

  /* =====================================================
     SCROLL
  ===================================================== */

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,

    paddingBottom: 100,
  },

  /* =====================================================
     LOADING
  ===================================================== */

  loadingBox: {
    minHeight: 420,

    alignItems: 'center',

    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,

    fontSize: 12,

    color: '#6B7280',

    fontWeight: '600',
  },

  /* =====================================================
     PROFILE
  ===================================================== */

  profileCard: {
    minHeight: 106,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E8E4DD',

    borderRadius: 18,

    paddingHorizontal: 18,

    paddingVertical: 17,

    justifyContent: 'center',

    marginBottom: 13,

    shadowColor: '#000',

    shadowOpacity: 0.025,

    shadowRadius: 7,

    shadowOffset: {
      width: 0,

      height: 3,
    },

    elevation: 1,
  },

  profileLeft: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  avatar: {
    width: 64,

    height: 64,

    borderRadius: 20,

    backgroundColor: '#E7F3EC',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 14,
  },

  avatarText: {
    fontSize: 23,

    fontWeight: '900',

    color: '#205E42',
  },

  profileTextArea: {
    flex: 1,
  },

  profileName: {
    fontSize: 17,

    fontWeight: '900',

    color: '#1A1A18',
  },

  profileEmail: {
    marginTop: 2,

    fontSize: 11,

    color: '#9CA3AF',

    fontWeight: '500',
  },

  /* =====================================================
     계정 관리
  ===================================================== */

  accountLink: {
    marginTop: 8,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    alignSelf: 'flex-start',
  },

  accountLinkText: {
    fontSize: 11,

    color: '#2D6A4F',

    fontWeight: '800',
  },

  /* =====================================================
     STATS
  ===================================================== */

  statsRow: {
    flexDirection: 'row',

    gap: 9,

    marginBottom: 14,
  },

  statCard: {
    flex: 1,

    height: 82,

    borderRadius: 16,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E8E4DD',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#000',

    shadowOpacity: 0.02,

    shadowRadius: 5,

    shadowOffset: {
      width: 0,

      height: 2,
    },

    elevation: 1,
  },

  statNumber: {
    fontSize: 24,

    lineHeight: 28,

    color: '#1D1E1B',

    fontWeight: '900',
  },

  statLabel: {
    marginTop: 4,

    fontSize: 10,

    color: '#7E8480',

    fontWeight: '700',
  },

  /* =====================================================
     ERROR
  ===================================================== */

  errorText: {
    fontSize: 11,

    color: '#D45D79',

    fontWeight: '800',

    marginBottom: 10,

    backgroundColor: '#FCEEEF',

    paddingHorizontal: 10,

    paddingVertical: 8,

    borderRadius: 10,
  },

  /* =====================================================
     MENU CARD
  ===================================================== */

  menuCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E8E4DD',

    borderRadius: 17,

    overflow: 'hidden',

    marginBottom: 13,

    shadowColor: '#000',

    shadowOpacity: 0.02,

    shadowRadius: 6,

    shadowOffset: {
      width: 0,

      height: 3,
    },

    elevation: 1,
  },

  menuRow: {
    minHeight: 56,

    paddingHorizontal: 17,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    borderBottomWidth: 1,

    borderBottomColor: '#EFEBE5',
  },

  menuRowLast: {
    minHeight: 56,

    paddingHorizontal: 17,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  menuText: {
    fontSize: 13,

    color: '#242623',

    fontWeight: '800',
  },

  menuRight: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,
  },

  menuValue: {
    fontSize: 11,

    color: '#96A0A8',

    fontWeight: '600',
  },

  /* =====================================================
     로그아웃
  ===================================================== */

  settingCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E8E6E0',

    borderRadius: 13,

    paddingHorizontal: 12,

    marginBottom: 10,
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

  /* =====================================================
     LOGOUT MODAL
  ===================================================== */

  modalOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(17, 24, 39, 0.35)',

    alignItems: 'center',

    justifyContent: 'center',

    paddingHorizontal: 28,
  },

  modalBox: {
    width: '100%',

    maxWidth: 320,

    backgroundColor: '#FFFFFF',

    borderRadius: 22,

    padding: 22,

    alignItems: 'center',

    shadowColor: '#000',

    shadowOpacity: 0.14,

    shadowRadius: 20,

    shadowOffset: {
      width: 0,

      height: 10,
    },

    elevation: 10,
  },

  modalGreenIcon: {
    width: 54,

    height: 54,

    borderRadius: 999,

    backgroundColor: '#E8F5EE',

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

    color: '#6B7280',

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

    borderColor: '#D1CEC8',

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#FFFFFF',
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

    backgroundColor: '#2D6A4F',

    alignItems: 'center',

    justifyContent: 'center',
  },

  modalConfirmText: {
    fontSize: 14,

    fontWeight: '900',

    color: '#FFFFFF',
  },
});