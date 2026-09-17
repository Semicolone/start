import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
    Alert,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

/*
 * =========================================================
 * FLOW 고객센터 이메일
 * =========================================================
 *
 * 현재 테스트용 이메일
 */
const SUPPORT_EMAIL =
  'ahdrmfdl4060@gmail.com';

export default function SupportScreen() {
  /*
   * =========================================================
   * 이메일 문의
   * =========================================================
   *
   * 사용자의 기본 메일 앱을 실행함.
   *
   * 받는 사람 / 제목 / 기본 본문까지
   * 자동으로 채워줌.
   *
   * 실제 발송은 사용자가
   * 메일 앱에서 "보내기"를 눌러야 함.
   */
  const handleEmailInquiry =
    async () => {
      const subject =
        '[FLOW] 고객센터 문의';

      const body = `안녕하세요, FLOW 고객센터에 문의드립니다.

[문의 내용]


감사합니다.`;

      /*
       * mailto 형식
       *
       * 받는 사람:
       * ahdrmfdl4060@gmail.com
       *
       * 제목:
       * [FLOW] 고객센터 문의
       *
       * 본문:
       * 기본 문의 양식
       */
      const mailUrl =
        `mailto:${SUPPORT_EMAIL}` +
        `?subject=${encodeURIComponent(
          subject
        )}` +
        `&body=${encodeURIComponent(
          body
        )}`;

      try {
        await Linking.openURL(
          mailUrl
        );
      } catch (error) {
        console.log(
          '메일 앱 실행 실패:',
          error
        );

        Alert.alert(
          '메일 앱을 열 수 없어요',
          `메일 앱 설정을 확인하거나\n${SUPPORT_EMAIL}로 직접 문의해주세요.`
        );
      }
    };

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
            <Pressable
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
            >
              <Ionicons
                name="chevron-back"
                size={23}
                color="#1A1A18"
              />
            </Pressable>

            <Text style={styles.title}>
              고객센터
            </Text>

            <View
              style={
                styles.headerSpacer
              }
            />
          </View>

          {/* =================================================
              CONTENT
          ================================================= */}

          <View
            style={
              styles.content
            }
          >
            {/* 메인 안내 */}

            <View
              style={
                styles.helpCard
              }
            >
              <View
                style={
                  styles.iconCircle
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={27}
                  color="#2D6A4F"
                />
              </View>

              <Text
                style={
                  styles.helpTitle
                }
              >
                무엇을 도와드릴까요?
              </Text>

              <Text
                style={
                  styles.helpDescription
                }
              >
                FLOW 이용 중 궁금한 점이나
                불편한 점이 있다면 이메일로
                문의해주세요.
              </Text>

              {/* 이메일 문의 버튼 */}

              <Pressable
                style={
                  styles.emailButton
                }
                onPress={
                  handleEmailInquiry
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.emailButtonText
                  }
                >
                  이메일 문의하기
                </Text>
              </Pressable>
            </View>

            {/* =================================================
                안내
            ================================================= */}

            <View
              style={
                styles.infoCard
              }
            >
              <View
                style={
                  styles.infoRow
                }
              >
                <View
                  style={
                    styles.infoIcon
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color="#2D6A4F"
                  />
                </View>

                <View
                  style={
                    styles.infoTextArea
                  }
                >
                  <Text
                    style={
                      styles.infoTitle
                    }
                  >
                    문의 답변
                  </Text>

                  <Text
                    style={
                      styles.infoDescription
                    }
                  >
                    확인 후 가능한 빠르게
                    답변드릴게요.
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.divider
                }
              />

              <View
                style={
                  styles.infoRow
                }
              >
                <View
                  style={
                    styles.infoIcon
                  }
                >
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color="#2D6A4F"
                  />
                </View>

                <View
                  style={
                    styles.infoTextArea
                  }
                >
                  <Text
                    style={
                      styles.infoTitle
                    }
                  >
                    문의 시 알려주세요
                  </Text>

                  <Text
                    style={
                      styles.infoDescription
                    }
                  >
                    오류 문의라면 발생 상황을
                    함께 적어주시면 확인에
                    도움이 돼요.
                  </Text>
                </View>
              </View>
            </View>

            {/* 이메일 주소 */}

            <Text
              style={
                styles.emailLabel
              }
            >
              FLOW 고객센터
            </Text>

            <Text
              style={
                styles.emailAddress
              }
            >
              {SUPPORT_EMAIL}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* =========================================================
   STYLE
========================================================= */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,

      backgroundColor:
        '#EAE5DA',
    },

    outer: {
      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EAE5DA',
    },

    phoneLikeContainer: {
      width: '100%',

      maxWidth: 360,

      height: '100%',

      minHeight: 640,

      backgroundColor:
        '#F7F6F1',
    },

    /* =====================================================
       HEADER
    ===================================================== */

    topbar: {
      paddingTop: 45,

      paddingHorizontal: 16,

      paddingBottom: 15,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'space-between',

      backgroundColor:
        '#F7F6F1',

      borderBottomWidth: 1,

      borderBottomColor:
        '#E8E4DD',
    },

    backButton: {
      width: 34,

      height: 34,

      alignItems: 'center',

      justifyContent:
        'center',
    },

    title: {
      fontSize: 18,

      fontWeight: '900',

      color: '#1A1A18',

      letterSpacing: -0.3,
    },

    headerSpacer: {
      width: 34,

      height: 34,
    },

    /* =====================================================
       CONTENT
    ===================================================== */

    content: {
      flex: 1,

      paddingHorizontal: 18,

      paddingTop: 24,
    },

    /* =====================================================
       HELP CARD
    ===================================================== */

    helpCard: {
      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#E8E4DD',

      borderRadius: 20,

      paddingHorizontal: 22,

      paddingVertical: 28,

      alignItems: 'center',

      shadowColor: '#000',

      shadowOpacity: 0.025,

      shadowRadius: 8,

      shadowOffset: {
        width: 0,

        height: 3,
      },

      elevation: 1,
    },

    iconCircle: {
      width: 62,

      height: 62,

      borderRadius: 999,

      backgroundColor:
        '#E8F5EE',

      alignItems: 'center',

      justifyContent:
        'center',

      marginBottom: 16,
    },

    helpTitle: {
      fontSize: 18,

      fontWeight: '900',

      color: '#1A1A18',

      marginBottom: 9,
    },

    helpDescription: {
      fontSize: 12,

      lineHeight: 19,

      color: '#6B7280',

      fontWeight: '600',

      textAlign: 'center',

      marginBottom: 22,
    },

    /* =====================================================
       EMAIL BUTTON
    ===================================================== */

    emailButton: {
      width: '100%',

      height: 50,

      borderRadius: 14,

      backgroundColor:
        '#2D6A4F',

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent:
        'center',

      gap: 8,
    },

    emailButtonText: {
      fontSize: 14,

      color: '#FFFFFF',

      fontWeight: '900',
    },

    /* =====================================================
       INFO CARD
    ===================================================== */

    infoCard: {
      marginTop: 14,

      paddingHorizontal: 16,

      paddingVertical: 4,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,

      borderColor:
        '#E8E4DD',

      borderRadius: 17,
    },

    infoRow: {
      minHeight: 71,

      flexDirection: 'row',

      alignItems: 'center',
    },

    infoIcon: {
      width: 38,

      height: 38,

      borderRadius: 12,

      backgroundColor:
        '#E8F5EE',

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 12,
    },

    infoTextArea: {
      flex: 1,
    },

    infoTitle: {
      fontSize: 12,

      fontWeight: '900',

      color: '#242623',

      marginBottom: 3,
    },

    infoDescription: {
      fontSize: 10,

      lineHeight: 15,

      color: '#8B8F8A',

      fontWeight: '600',
    },

    divider: {
      height: 1,

      marginLeft: 50,

      backgroundColor:
        '#EFEBE5',
    },

    /* =====================================================
       EMAIL INFO
    ===================================================== */

    emailLabel: {
      marginTop: 21,

      fontSize: 10,

      color: '#9CA3AF',

      fontWeight: '800',

      textAlign: 'center',
    },

    emailAddress: {
      marginTop: 5,

      fontSize: 11,

      color: '#2D6A4F',

      fontWeight: '800',

      textAlign: 'center',
    },
  });