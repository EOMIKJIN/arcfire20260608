import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArcCoreHub } from './types';

const STORAGE_KEY = 'arcfire_arc_core_last_left_active_ms_v1';

/**
 * 사용자가 앱을 떠난 실시간 구간을, 다음 실행(또는 포그라운드 복귀) 시 벽시계에 반영한다.
 */

export async function persistArcCoreWallClockLeftActiveNow(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/**
 * 저장된 "마지막 비활성 시각"부터 지금까지 경과를 벽시계에 반영한 뒤 기준 시각을 갱신한다.
 * 월드 로드 이후 호출할 것(`WorldExpansionSubCore` 등이 `world.loaded`를 요구).
 */
export async function applyArcCoreWallClockCatchUpFromPersistedGap(hub: ArcCoreHub): Promise<void> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (raw === null) return;
  const lastMs = Number.parseInt(raw, 10);
  if (!Number.isFinite(lastMs) || lastMs <= 0) return;
  const deltaSec = (Date.now() - lastMs) / 1000;
  if (deltaSec < 1) return;
  hub.applyOfflineCatchUpWallClock(deltaSec);
  await persistArcCoreWallClockLeftActiveNow();
}
