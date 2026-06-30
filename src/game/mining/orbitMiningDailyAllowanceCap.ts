// ============================================================
// 궤도 채굴 일일 allowance 상한 — store import 없음 (순환 참조 차단)
//
// 광물 = 기초 재화 · 행성 R(자원)의 일부만 반영(100% 치환 금지).
// 정본: planetMineralLedgerPolicy.resolvePlanetMineralReserveMaxUnits
// ============================================================

import { resolvePlanetMineralReserveMaxUnits } from '../../arcCore/planetResource/planetMineralLedgerPolicy';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';

function readRuntimeResource(planetId: string, override?: number): number {
  if (override != null && Number.isFinite(override)) return override;
  return usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId)?.resource ?? 50;
}

/**
 * 추후 아이템·스킬·BM — 일일 채굴 한도 보너스(단위).
 */
export function resolveOrbitMiningDailyLimitBonusUnits(_planetId: string): number {
  return 0;
}

/** 광물 allowance 상한 — R 부분 반영 + 행성별 mineral pool (≠ R 전체) */
export function resolveOrbitMiningDailyAllowanceCapUnits(
  planetId: string,
  runtimeResource?: number,
): number {
  const r = readRuntimeResource(planetId, runtimeResource);
  const base = resolvePlanetMineralReserveMaxUnits(r);
  return base + Math.max(0, resolveOrbitMiningDailyLimitBonusUnits(planetId));
}
