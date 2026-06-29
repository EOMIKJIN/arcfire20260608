// ============================================================
// 개방 synth — 5대 스탯 런타임 + 교역 생태계 일괄 연동 (기존 21행성과 동일 규칙)
// ============================================================

import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { ensureUnlockedSynthFrontierEconomyEnrollment } from '../economy/synthFrontierConvoyTradeBridge';

export type UnlockedSynthFrontierStatEconomyIntegrationResult = {
  coreRuntimeTouched: number;
  economyEnrolled: number;
};

/** hydrated 전제 — 코어 런타임 동기 + convoy·재정 프로필 등록 */
export function integrateUnlockedSynthFrontierStatEconomy(): UnlockedSynthFrontierStatEconomyIntegrationResult {
  const coreRuntimeTouched = usePlanetCoreRuntimeStore
    .getState()
    .ensureUnlockedWorldPlanetsInCoreRuntime();
  const economyEnrolled = ensureUnlockedSynthFrontierEconomyEnrollment();
  return { coreRuntimeTouched, economyEnrolled };
}

/** 부트·개방 직후·일일 배치 — hydrate 후 연동 */
export async function integrateUnlockedSynthFrontierStatEconomyAsync(): Promise<UnlockedSynthFrontierStatEconomyIntegrationResult> {
  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) {
    await core.bootstrapFromWorldAsync();
  } else {
    core.ensureUnlockedWorldPlanetsInCoreRuntime();
  }
  return integrateUnlockedSynthFrontierStatEconomy();
}
