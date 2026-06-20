// ============================================================
// 행성개발 집계 — 레벨업 5대 지표·비용/유지비 효율·TDI(PGP)
// v2.3: 세부 모듈 보상 + 집계형 행성 성장·비용 효율 단일 허브
// ============================================================

import {
  resolvePlanetDevCostEfficiencyAggregateWeightPerLevel,
  resolvePlanetDevCostEfficiencyDiscountCapPct,
  resolvePlanetDevCostEfficiencyTechWeightPerPoint,
  resolvePlanetDevLevelUpStatNudgeDailyFraction,
  resolvePlanetDevTdiPgpBmuPerPoint,
  resolvePlanetDevUpkeepEfficiencyAggregateWeightPerLevel,
  resolvePlanetDevUpkeepEfficiencyDiscountCapPct,
  resolvePlanetDevUpkeepEfficiencyTechWeightPerPoint,
} from '../balance/planetDevelopmentAggregatePolicy';
import {
  resolveFacilityStatNudgesForLevel,
  resolveFacilityTdiContributionForLevel,
} from '../balance/facilityUpgradeLevelsPolicy';
import { listInstalledFacilityLevels } from '../../game/planetDevelopment/planetFacilityLevelResolver';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { PlanetClanHold } from '../../types';
import { usePlayerStore } from '../../store/playerStore';

const STAT_CAP = 100;

function isPlayerOwnedHold(hold: PlanetClanHold, playerUid: string | null | undefined): boolean {
  if (!playerUid) return false;
  if (hold.homePlayerUid === playerUid) return true;
  if (hold.kind === 'player_home' && hold.homePlayerUid === playerUid) return true;
  return false;
}

function isPlayerOwnedPlanet(planetId: string): boolean {
  const playerUid = usePlayerStore.getState().player?.uid ?? null;
  if (!playerUid) return false;
  const hold = useClanWarFoundationStore.getState().planetHolds[planetId];
  return hold ? isPlayerOwnedHold(hold, playerUid) : false;
}

function clampGauge(g: PlanetCoreGaugeView): PlanetCoreGaugeView {
  return {
    resource: Math.max(0, Math.min(STAT_CAP, Math.round(g.resource))),
    population: Math.max(0, Math.min(STAT_CAP, Math.round(g.population))),
    defense: Math.max(0, Math.min(STAT_CAP, Math.round(g.defense))),
    technology: Math.max(0, Math.min(STAT_CAP, Math.round(g.technology))),
    environment: Math.max(0, Math.min(STAT_CAP, Math.round(g.environment))),
  };
}

/** 설치 시설 레벨 합(집계 개발 점수) */
export function resolvePlanetDevelopmentAggregateLevelSum(planetId: string): number {
  let sum = 0;
  for (const f of listInstalledFacilityLevels(planetId)) {
    if (f.installed && f.level > 0) sum += f.level;
  }
  return sum;
}

/** TDI(개발 기여) — facility_upgrade_levels tdi_contribution_formula 합 */
export function resolvePlanetDevelopmentTdiScore(planetId: string): number {
  let total = 0;
  for (const f of listInstalledFacilityLevels(planetId)) {
    if (!f.installed || f.level <= 0) continue;
    total += resolveFacilityTdiContributionForLevel(f.facilityType, f.level);
  }
  return Math.max(0, Math.floor(total));
}

export function resolvePlanetDevelopmentTdiPgpBonusBmu(planetId: string): number {
  const perPoint = resolvePlanetDevTdiPgpBmuPerPoint();
  if (perPoint <= 0) return 0;
  return resolvePlanetDevelopmentTdiScore(planetId) * perPoint;
}

/** 업그레이드·설치 비용 할인(%) — T 스탯 + 시설 레벨 합 */
export function resolvePlanetDevCostEfficiencyDiscountPct(planetId: string): number {
  const core = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  const tech = core?.technology ?? 0;
  const agg = resolvePlanetDevelopmentAggregateLevelSum(planetId);
  const fromTech = tech * resolvePlanetDevCostEfficiencyTechWeightPerPoint() * 100;
  const fromAgg = agg * resolvePlanetDevCostEfficiencyAggregateWeightPerLevel();
  const cap = resolvePlanetDevCostEfficiencyDiscountCapPct();
  return Math.min(cap, fromTech + fromAgg);
}

/** 개발 유지비 절감(%) */
export function resolvePlanetDevUpkeepEfficiencyDiscountPct(planetId: string): number {
  const core = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  const tech = core?.technology ?? 0;
  const agg = resolvePlanetDevelopmentAggregateLevelSum(planetId);
  const fromTech = tech * resolvePlanetDevUpkeepEfficiencyTechWeightPerPoint() * 100;
  const fromAgg = agg * resolvePlanetDevUpkeepEfficiencyAggregateWeightPerLevel();
  const cap = resolvePlanetDevUpkeepEfficiencyDiscountCapPct();
  return Math.min(cap, fromTech + fromAgg);
}

/** Table-First 비용 — 할인 적용 후 크레딧 */
export function resolvePlanetDevDiscountedCredits(planetId: string, baseCredits: number): number {
  const base = Math.max(0, Math.floor(baseCredits));
  if (base <= 0) return 0;
  const discount = resolvePlanetDevCostEfficiencyDiscountPct(planetId);
  return Math.max(0, Math.ceil(base * (1 - discount / 100)));
}

/** 개발 유지비 — 효율 절감 적용 */
export function applyPlanetDevUpkeepEfficiency(planetId: string, baseUpkeepCredits: number): number {
  const base = Math.max(0, Math.floor(baseUpkeepCredits));
  if (base <= 0) return 0;
  const discount = resolvePlanetDevUpkeepEfficiencyDiscountPct(planetId);
  return Math.max(0, Math.ceil(base * (1 - discount / 100)));
}

/**
 * 시설 레벨 적용 시 — v2.0 §1-2: 5대 스탯 nudge는 일 1회 배치 전용.
 * level_up_stat_nudge_daily_fraction=0 이면 no-op(캐시·TDI 등은 별도 패스).
 */
export function applyPlanetFacilityLevelUpBenefits(
  planetId: string,
  facilityType: string,
  newLevel: number,
): void {
  if (!planetId || !facilityType || newLevel <= 0) return;
  if (!isPlayerOwnedPlanet(planetId)) return;

  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  if (!runtime) return;

  const daily = resolveFacilityStatNudgesForLevel(facilityType, newLevel);
  const fraction = resolvePlanetDevLevelUpStatNudgeDailyFraction();
  const bump: PlanetCoreGaugeView = {
    resource: daily.resource * fraction,
    population: daily.population * fraction,
    defense: daily.defense * fraction,
    technology: daily.technology * fraction,
    environment: daily.environment * fraction,
  };
  const hasAny =
    bump.resource + bump.population + bump.defense + bump.technology + bump.environment > 0;
  if (!hasAny) return;

  const next = clampGauge({
    resource: runtime.resource + bump.resource,
    population: runtime.population + bump.population,
    defense: runtime.defense + bump.defense,
    technology: runtime.technology + bump.technology,
    environment: runtime.environment + bump.environment,
  });

  usePlanetCoreRuntimeStore.getState().patchPlanetCore(planetId, next);
}
