// ============================================================
// v2.0 — 시설 레벨 → 5대 스탯 일 1회 nudge (점유 중인 행성만)
// ============================================================

import { resolveFacilityStatNudgesForLevel } from '../balance/facilityUpgradeLevelsPolicy';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import type { PlanetClanHold } from '../../types';
import { usePlayerStore } from '../../store/playerStore';
import { listInstalledFacilityLevels } from '../../game/planetDevelopment/planetFacilityLevelResolver';

export type FacilityStatNudgePassResult = {
  ran: boolean;
  planetsProcessed: number;
  totalNudgeApplied: PlanetCoreGaugeView;
};

const STAT_CAP = 100;

function isPlayerOwnedHold(hold: PlanetClanHold, playerUid: string | null | undefined): boolean {
  if (!playerUid) return false;
  if (hold.homePlayerUid === playerUid) return true;
  if (hold.kind === 'player_home' && hold.homePlayerUid === playerUid) return true;
  return false;
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

function sumFacilityNudges(planetId: string): PlanetCoreGaugeView {
  const acc: PlanetCoreGaugeView = {
    resource: 0,
    population: 0,
    defense: 0,
    technology: 0,
    environment: 0,
  };
  for (const f of listInstalledFacilityLevels(planetId)) {
    if (!f.installed || f.level <= 0) continue;
    const n = resolveFacilityStatNudgesForLevel(f.facilityType, f.level);
    acc.resource += n.resource;
    acc.population += n.population;
    acc.defense += n.defense;
    acc.technology += n.technology;
    acc.environment += n.environment;
  }
  return acc;
}

/**
 * 일 1회 배치 — runPlanetPgpDailyPass **직전** 호출.
 * 점유 상실 중에는 nudge 정지(v2.0 §8).
 */
export function runFacilityStatNudgePass(): FacilityStatNudgePassResult {
  const playerUid = usePlayerStore.getState().player?.uid ?? null;
  const holds = useClanWarFoundationStore.getState().planetHolds;
  const store = usePlanetCoreRuntimeStore.getState();

  const totalNudgeApplied: PlanetCoreGaugeView = {
    resource: 0,
    population: 0,
    defense: 0,
    technology: 0,
    environment: 0,
  };
  let planetsProcessed = 0;

  for (const [planetId, hold] of Object.entries(holds)) {
    if (!isPlayerOwnedHold(hold, playerUid)) continue;
    const runtime = store.getPlanetCoreRuntime(planetId);
    if (!runtime) continue;

    const nudge = sumFacilityNudges(planetId);
    const hasAny = nudge.resource + nudge.population + nudge.defense + nudge.technology + nudge.environment > 0;
    if (!hasAny) continue;

    const next = clampGauge({
      resource: runtime.resource + nudge.resource,
      population: runtime.population + nudge.population,
      defense: runtime.defense + nudge.defense,
      technology: runtime.technology + nudge.technology,
      environment: runtime.environment + nudge.environment,
    });

    store.patchPlanetCore(planetId, next);
    planetsProcessed += 1;
    totalNudgeApplied.resource += nudge.resource;
    totalNudgeApplied.population += nudge.population;
    totalNudgeApplied.defense += nudge.defense;
    totalNudgeApplied.technology += nudge.technology;
    totalNudgeApplied.environment += nudge.environment;
  }

  return { ran: planetsProcessed > 0, planetsProcessed, totalNudgeApplied };
}
