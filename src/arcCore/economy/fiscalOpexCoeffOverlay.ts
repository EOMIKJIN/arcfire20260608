// ============================================================
// 일 1회 계수 힌트 — k_mil/k_ship 배율만 (±캡). 가격 변경 없음.
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ArcCoreFiscalOpexPolicy } from './arcCoreFiscalOpexPolicy';

const STORAGE_KEY = 'arcfire_fiscal_opex_coeff_overlay_v1';

export type FiscalOpexCoeffOverlay = {
  kstDayKey: string;
  kMilMul: number;
  kShipMul: number;
};

const DEFAULT: FiscalOpexCoeffOverlay = { kstDayKey: '', kMilMul: 1, kShipMul: 1 };

let cache: FiscalOpexCoeffOverlay = { ...DEFAULT };
let hydrated = false;

function clampMul(n: number, min: number, max: number): number {
  const x = Number.isFinite(n) ? n : 1;
  return Math.max(min, Math.min(max, Math.round(x * 1000) / 1000));
}

export async function hydrateFiscalOpexCoeffOverlay(): Promise<FiscalOpexCoeffOverlay> {
  if (hydrated) return cache;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FiscalOpexCoeffOverlay>;
      cache = {
        kstDayKey: String(parsed.kstDayKey ?? ''),
        kMilMul: Number(parsed.kMilMul) || 1,
        kShipMul: Number(parsed.kShipMul) || 1,
      };
    }
  } catch {
    cache = { ...DEFAULT };
  }
  hydrated = true;
  return cache;
}

export function getFiscalOpexCoeffOverlay(): FiscalOpexCoeffOverlay {
  return { ...cache };
}

export function applyFiscalOpexCoeffHints(
  policy: ArcCoreFiscalOpexPolicy,
  kstDayKey: string,
  input: { redMultiple: number; fleetMultiple: number },
): FiscalOpexCoeffOverlay {
  if (!policy.coeffHintEnabled) return getFiscalOpexCoeffOverlay();
  if (cache.kstDayKey === kstDayKey) return getFiscalOpexCoeffOverlay();
  let kMilMul = cache.kMilMul || 1;
  let kShipMul = cache.kShipMul || 1;
  const step = policy.coeffHintStepPct / 100;
  if (input.redMultiple >= policy.coeffHintSeedMultiple) kMilMul += step;
  else kMilMul -= step * 0.5;
  if (input.fleetMultiple >= policy.coeffHintSeedMultiple) kShipMul += step;
  else kShipMul -= step * 0.5;
  cache = {
    kstDayKey,
    kMilMul: clampMul(kMilMul, policy.coeffHintMulMin, policy.coeffHintMulMax),
    kShipMul: clampMul(kShipMul, policy.coeffHintMulMin, policy.coeffHintMulMax),
  };
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache)).catch(() => {
    /* 메모리 배율 유지 */
  });
  return getFiscalOpexCoeffOverlay();
}

export function scaleFiscalOpexPolicyCoeffs(
  policy: ArcCoreFiscalOpexPolicy,
  overlay: FiscalOpexCoeffOverlay,
): ArcCoreFiscalOpexPolicy {
  return {
    ...policy,
    kMil: policy.kMil * overlay.kMilMul,
    kShip: policy.kShip * overlay.kShipMul,
  };
}
