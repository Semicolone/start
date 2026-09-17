import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { myApi } from './client';

/*
 * =========================================================
 * FLOW PUSH NOTIFICATION
 * =========================================================
 *
 * 역할:
 * 1. 사용자에게 알림 권한 요청
 * 2. Expo Push Token 발급
 * 3. 발급받은 토큰을 백엔드에 저장
 *
 * 백엔드:
 * PUT /api/my/push_token?push_token=ExpoPushToken[...]
 *
 * 3일 계산 / 리마인드 발송은 백엔드가 담당한다.
 */

export async function registerPushNotifications() {
  /*
   * 웹에서는 모바일 푸시 등록을 하지 않는다.
   */
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    /*
     * Android는 알림 권한 요청 전에
     * Notification Channel을 만들어두는 것이 안전하다.
     */
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(
        'default',
        {
          name: 'FLOW 알림',
          importance:
            Notifications.AndroidImportance.MAX,
          vibrationPattern: [
            0,
            250,
            250,
            250,
          ],
        }
      );
    }

    /*
     * 현재 알림 권한 상태 확인
     */
    const {
      status: existingStatus,
    } =
      await Notifications.getPermissionsAsync();

    let finalStatus =
      existingStatus;

    /*
     * 아직 허용되지 않았다면
     * 사용자에게 알림 권한 요청
     */
    if (
      existingStatus !==
      'granted'
    ) {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    /*
     * 사용자가 알림을 허용하지 않았다면
     * 로그인은 그대로 진행하고
     * 푸시 등록만 하지 않는다.
     */
    if (
      finalStatus !==
      'granted'
    ) {
      console.log(
        '알림 권한이 허용되지 않았습니다.'
      );

      return null;
    }

    /*
     * Expo 프로젝트 ID 확인
     *
     * eas init을 실행하면
     * app.json의
     * extra.eas.projectId에
     * 자동으로 생성된다.
     */
    const projectId =
      Constants.expoConfig
        ?.extra?.eas
        ?.projectId ??
      Constants.easConfig
        ?.projectId;

    if (!projectId) {
      console.log(
        'EAS projectId가 없습니다. eas init을 먼저 실행해주세요.'
      );

      return null;
    }

    /*
     * 이 휴대폰의 Expo Push Token 발급
     *
     * 예:
     * ExpoPushToken[xxxxxxxxxxxx]
     */
    const expoPushToken =
      (
        await Notifications.getExpoPushTokenAsync(
          {
            projectId,
          }
        )
      ).data;

    /*
     * 발급받은 토큰을
     * FLOW 백엔드에 저장
     */
    await myApi.updatePushToken(
      expoPushToken
    );

    console.log(
      'FLOW 푸시 토큰 등록 성공:',
      expoPushToken
    );

    return expoPushToken;
  } catch (error) {
    /*
     * 푸시 등록에 실패하더라도
     * 로그인 자체는 막지 않는다.
     */
    console.log(
      'FLOW 푸시 토큰 등록 실패:',
      error
    );

    return null;
  }
}