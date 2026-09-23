// ============================================================
// 일 1회 오펙스 스냅샷 — UI/바/조선소가 같은 프록시 키를 읽음
// 렌더에서 재계산·dispatch 금지
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'arcfire_fiscal_opex_snapshot_v1';

export type FiscalOpexHudSnapshot = {
  kstDayKey: string;
  shadow: boolean;
  requestedSum: number;
  spentSum: number;
  captainCount: number;
  laboratoryLevelSum: number;
  kCap: number;
  kRd: number;
  kMilMul: number;
  kShipMul: number;
};

let cache: FiscalOpexHudSnapshot | null = null;

export function getFiscalOpexHudSnapshot(): FiscalOpexHudSnapshot | null {
  return cache;
}

export async function persistFiscalOpexHudSnapshot(next: FiscalOpexHudSnapshot): Promise<void> {
  cache = next;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* 메모리 스냅샷 유지 */
  }
}

export async function hydrateFiscalOpexHudSnapshot(): Promise<FiscalOpexHudSnapshot | null> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    cache = JSON.parse(raw) as FiscalOpexHudSnapshot;
    return cache;
  } catch {
    return null;
  }
}
