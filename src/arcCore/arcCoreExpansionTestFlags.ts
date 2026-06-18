import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDevHarnessAllowed } from '../game/gameplayModeContract';
import { getWorldExpansionTimingPolicy } from './balance/balanceTableRegistry';

export const ARC_EXPANSION_TEST_ONE_SHOT_DONE_KEY = 'arcfire_arc_expansion_test_one_shot_done_v1';
const PROD_INTERVAL_SEC = getWorldExpansionTimingPolicy().prodUnlockIntervalSec;

let oneShotDone = false;

export function isArcExpansionTestOneShotEnvOn(): boolean {
  if (!isDevHarnessAllowed()) return false;
  return process.env.EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_ONE_SHOT === '1';
}

export function isArcExpansionTestOneShotConsumed(): boolean {
  return oneShotDone;
}

export function resetArcExpansionTestHarnessMemory(): void {
  oneShotDone = false;
}

export async function purgeArcExpansionTestHarnessStorage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ARC_EXPANSION_TEST_ONE_SHOT_DONE_KEY);
  } catch {
    /* ignore */
  }
}

export async function loadArcExpansionTestOneShotDoneFromStorage(): Promise<void> {
  if (!isDevHarnessAllowed()) {
    oneShotDone = false;
    return;
  }
  try {
    const v = await AsyncStorage.getItem(ARC_EXPANSION_TEST_ONE_SHOT_DONE_KEY);
    oneShotDone = v === '1';
  } catch {
    oneShotDone = false;
  }
}

export async function markArcExpansionTestOneShotDoneAsync(): Promise<void> {
  if (!isDevHarnessAllowed()) return;
  oneShotDone = true;
  try {
    await AsyncStorage.setItem(ARC_EXPANSION_TEST_ONE_SHOT_DONE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function readHarnessTestIntervalSec(): number | null {
  const raw = process.env.EXPO_PUBLIC_ARCCORE_EXPANSION_TEST_INTERVAL_SEC;
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 5 || n > 86400) return null;
  return n;
}

/** 테스트 간격(초). 운영·릴리스는 항상 프로덕션 24h. */
export function getExpansionUnlockIntervalSec(): number {
  if (!isDevHarnessAllowed()) return PROD_INTERVAL_SEC;
  if (oneShotDone) return PROD_INTERVAL_SEC;
  if (isArcExpansionTestOneShotEnvOn()) {
    return readHarnessTestIntervalSec() ?? 60;
  }
  return readHarnessTestIntervalSec() ?? PROD_INTERVAL_SEC;
}

export function getExpansionProbeIntervalSec(unlockIntervalSec: number): number {
  return unlockIntervalSec < PROD_INTERVAL_SEC ? 5 : 30;
}

/**
 * synth_033·073 부트 강제 개방 — 하네스 + `EXPO_PUBLIC_ARCCORE_LEGACY_GUARANTEED_UNLOCK=1` 전용.
 * release 및 일반 debug 빌드에서는 항상 false.
 */
export function isArcCoreLegacyGuaranteedUnlockEnabled(): boolean {
  if (!isDevHarnessAllowed()) return false;
  return process.env.EXPO_PUBLIC_ARCCORE_LEGACY_GUARANTEED_UNLOCK === '1';
}
