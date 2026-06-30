// ============================================================
// 궤도 채굴 — 플레이어-facing 일일 한도 (내부: planetMineralLedger)
// 광물 = 기초 재화 · R(자원) 5대 지표의 부분만 반영(≠ R 100%).
// cap 계산: orbitMiningDailyAllowanceCap.ts (store 순환 참조 방지).
// ============================================================

import { resolvePlanetMineralLedgerPolicy } from '../../arcCore/planetResource/planetMineralLedgerPolicy';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { usePlanetMineralLedgerStore } from '../../store/planetMineralLedgerStore';

export {
  resolveOrbitMiningDailyAllowanceCapUnits,
  resolveOrbitMiningDailyLimitBonusUnits,
} from './orbitMiningDailyAllowanceCap';

function readRuntimeResource(planetId: string, override?: number): number {
  if (override != null && Number.isFinite(override)) return override;
  return usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId)?.resource ?? 50;
}

/** 일일 allowance 소진(채굴 시작·tick 중단 게이트) — 매장량 UI 노출 없음 */
export function isOrbitMiningDailyAllowanceExhausted(
  planetId: string,
  runtimeResource?: number,
): boolean {
  const policy = resolvePlanetMineralLedgerPolicy();
  if (!policy.enabled) return false;
  const reserve = usePlanetMineralLedgerStore
    .getState()
    .getReserveUnits(planetId, readRuntimeResource(planetId, runtimeResource));
  return reserve <= policy.miningReserveFloorUnits;
}
