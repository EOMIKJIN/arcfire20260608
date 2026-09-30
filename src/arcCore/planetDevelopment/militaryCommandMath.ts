// ============================================================
// 사령부 순수 계산 — RN/store 미의존 (테스트·런타임 공용)
// ============================================================

import {
  interpolateMilitaryCommandLevel,
  resolvePlanetMilitaryCommandPolicy,
  scaleMilitaryCommandToLevel,
} from '../balance/planetMilitaryCommandPolicy';

export type MilitaryCommandStatOffset = {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
};

const ZERO: MilitaryCommandStatOffset = Object.freeze({
  resource: 0,
  population: 0,
  defense: 0,
  technology: 0,
  environment: 0,
});

export function resolveMilitaryCommandLogisticsDiscountPct(level: number): number {
  const policy = resolvePlanetMilitaryCommandPolicy();
  if (level <= 0) return 0;
  return Math.min(
    policy.logisticsUpkeepDiscountCapPct,
    interpolateMilitaryCommandLevel(level, 0, policy.logisticsUpkeepDiscountCapPct),
  );
}

export function resolveMilitaryCommandStatOffsetsFromLevel(level: number): MilitaryCommandStatOffset {
  const lv = Math.max(0, Math.floor(level) || 0);
  if (lv <= 0) return ZERO;
  const policy = resolvePlanetMilitaryCommandPolicy();
  return {
    resource: scaleMilitaryCommandToLevel(lv, policy.statOffsetRL15),
    population: scaleMilitaryCommandToLevel(lv, policy.statOffsetPL15),
    defense: scaleMilitaryCommandToLevel(lv, policy.statOffsetDL15),
    technology: scaleMilitaryCommandToLevel(lv, policy.statOffsetTL15),
    environment: scaleMilitaryCommandToLevel(lv, policy.statOffsetEL15),
  };
}

function clampStat(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

export function applyMilitaryCommandStatOffsetValues(
  targets: MilitaryCommandStatOffset,
  floors: Partial<MilitaryCommandStatOffset>,
  off: MilitaryCommandStatOffset,
): MilitaryCommandStatOffset {
  if (
    off.resource === 0
    && off.population === 0
    && off.defense === 0
    && off.technology === 0
    && off.environment === 0
  ) {
    return targets;
  }
  const policy = resolvePlanetMilitaryCommandPolicy();
  const floorOf = (genesis: number | undefined) =>
    Math.max(policy.statOffsetFloor, Math.max(0, Math.floor(genesis ?? 0)));
  return {
    resource: clampStat(Math.max(floorOf(floors.resource), targets.resource + off.resource)),
    population: clampStat(Math.max(floorOf(floors.population), targets.population + off.population)),
    defense: clampStat(Math.max(floorOf(floors.defense), targets.defense + off.defense)),
    technology: clampStat(Math.max(floorOf(floors.technology), targets.technology + off.technology)),
    environment: clampStat(Math.max(floorOf(floors.environment), targets.environment + off.environment)),
  };
}

export function applyMilitaryCommandUpkeepLineCreditsWithGlobal(
  baseCredits: number,
  level: number,
  globalPct: number,
): number {
  const base = Math.max(0, Math.floor(baseCredits));
  if (base <= 0 || level <= 0) return base;
  const policy = resolvePlanetMilitaryCommandPolicy();
  const military = resolveMilitaryCommandLogisticsDiscountPct(level);
  const remain = Math.max(0, policy.hqUpkeepJointCapPct - Math.max(0, globalPct));
  const discount = Math.min(military, remain);
  return Math.max(0, Math.ceil(base * (1 - discount / 100)));
}
