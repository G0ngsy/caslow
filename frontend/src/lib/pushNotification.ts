// 푸시 알림 토큰 등록 및 저장
import * as Notifications from 'expo-notifications';
import { savePushToken } from './api';

export async function registerPushToken() {
  try {
    // 푸시 알림 권한 요청
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('푸시 알림 권한 거부됨');
      return;
    }

    // 푸시 토큰 발급
    const token = await Notifications.getExpoPushTokenAsync();

    // 백엔드에 토큰 저장
    await savePushToken(token.data);
    console.log('푸시 토큰 저장 완료:', token.data);
  } catch (error) {
    console.error('푸시 토큰 등록 실패:', error);
  }
}