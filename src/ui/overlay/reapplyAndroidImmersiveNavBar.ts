import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';

/** 오버레이 표시 시 OS가 하단 내비를 다시 올리면 insets·터치가 깨질 수 있어 루트와 동일하게 재적용 */
export async function reapplyAndroidImmersiveNavBar(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await NavigationBar.setVisibilityAsync('hidden');
    await NavigationBar.setBehaviorAsync('overlay-swipe');
  } catch {
    // Expo Go / 미지원
  }
}
