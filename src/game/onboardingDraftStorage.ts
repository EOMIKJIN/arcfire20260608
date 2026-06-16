// ============================================================
// 온보딩 초안 — 캐릭터 선택 → 닉네임 생성 사이 professionId 전달
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'arcfire_onboarding_profession_v1';

export async function setOnboardingProfessionId(professionId: string): Promise<void> {
  await AsyncStorage.setItem(KEY, professionId.trim());
}

export async function getOnboardingProfessionId(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(KEY);
  const id = raw?.trim();
  return id || null;
}

export async function clearOnboardingProfessionId(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
