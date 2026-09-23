// ============================================================
// F7 R2 — in-flight convoy 화물 경량 persist (부트 후 원금 복구)
// 틱 persist 금지 · 적재/하역/클리어 시 1.5s 코얼레싱 · 상한 16
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'arcfire_convoy_ram_cargo_v1';
const MAX_LOTS = 16;
const COALESCE_MS = 1500;

export type PersistedConvoyCargoLot = {
  shipId: string;
  tgId: string;
  qty: number;
  unitBuyPrice: number;
  srcPlanetId: string;
  plannedDestPlanetId: string;
};

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPayload: string | null = null;
let hydrated = false;

export async function hydrateConvoyRamCargoLots(): Promise<PersistedConvoyCargoLot[]> {
  if (hydrated) return [];
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { lots?: PersistedConvoyCargoLot[] };
    const lots = Array.isArray(parsed.lots) ? parsed.lots : [];
    return lots.slice(0, MAX_LOTS).filter((row) => row && typeof row.shipId === 'string' && row.tgId);
  } catch {
    return [];
  }
}

export function markConvoyRamCargoHydrated(): void {
  hydrated = true;
}

export function scheduleConvoyRamCargoPersist(lots: PersistedConvoyCargoLot[]): void {
  pendingPayload = JSON.stringify({ lots: lots.slice(0, MAX_LOTS) });
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const payload = pendingPayload;
    pendingPayload = null;
    if (payload == null) return;
    void AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => {
      /* 다음 적재/하역에서 재시도 */
    });
  }, COALESCE_MS);
}
