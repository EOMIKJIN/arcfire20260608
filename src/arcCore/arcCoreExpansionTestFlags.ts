import AsyncStorage from '@react-native-async-storage/async-storage';

const ONE_SHOT_DONE_KEY = 'arcfire_arc_expansion_test_one_shot_done_v1';
const PROD_INTERVAL_SEC = 24 * 60 * 60;

let oneShotDone = false;

export function isArcExpansionTestOneShotEnvOn(): boolean {
  return process.env.EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_ONE_SHOT === '1';
}

export function isArcExpansionTestOneShotConsumed(): boolean {
  return oneShotDone;
}

export async function loadArcExpansionTestOneShotDoneFromStorage(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(ONE_SHOT_DONE_KEY);
    oneShotDone = v === '1';
  } catch {
    oneShotDone = false;
  }
}

export async function markArcExpansionTestOneShotDoneAsync(): Promise<void> {
  oneShotDone = true;
  try {
    await AsyncStorage.setItem(ONE_SHOT_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** 테스트 간격(초). 원샷 완료 후에는 항상 프로덕션 24h. */
export function getExpansionUnlockIntervalSec(): number {
  if (oneShotDone) return PROD_INTERVAL_SEC;
  if (isArcExpansionTestOneShotEnvOn()) {
    const raw = process.env.EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_INTERVAL_SEC;
    if (typeof raw === 'string' && raw.trim() !== '') {
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n) && n >= 5 && n <= 86400) return n;
    }
    return 60;
  }
  const raw = process.env.EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_INTERVAL_SEC;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 5 && n <= 86400) return n;
  }
  return PROD_INTERVAL_SEC;
}

export function getExpansionProbeIntervalSec(unlockIntervalSec: number): number {
  return unlockIntervalSec < PROD_INTERVAL_SEC ? 5 : 30;
}
