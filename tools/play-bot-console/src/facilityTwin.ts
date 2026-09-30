import { FacilityBarLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityBarLevelPolicy';
import { FacilityLaboratoryLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityLaboratoryLevelPolicy';
import { FacilityShipyardLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityShipyardLevelPolicy';
import { FacilityTradePortLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityTradePortLevelPolicy';
import { FacilityMilitaryCommandLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityMilitaryCommandLevelPolicy';
import { FacilityUpgradeDurationFacilityMod_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityUpgradeDurationFacilityMod';
import { FacilityUpgradeDurationSteps_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvFacilityUpgradeDurationSteps';
import { PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvPlanetDefenseSatelliteLevelPolicy';
import { TICK_GAME_MS } from './clock';
import { DEV_MAX_LEVEL, listDevModules } from './catalog';
import type { WorldState } from './types';

const TICK_GAME_SEC = TICK_GAME_MS / 1000;

type FacKey = 'trade_port' | 'shipyard' | 'defense_satellite' | 'laboratory' | 'bar' | 'military_command';

const MODULE_FAC: Record<string, FacKey> = {
  defense_satellite: 'defense_satellite',
  dev_orbit_shipyard: 'shipyard',
  dev_trade_port: 'trade_port',
  dev_research_lab: 'laboratory',
  dev_population_dome: 'bar',
  dev_military_command: 'military_command',
};

type LevelRow = {
  level: number;
  install: number;
  upgrade: number;
  pilotMin: number;
  statType: string;
  statValue: number;
};

function parseRows(raw: readonly Record<string, string>[]): LevelRow[] {
  const out: LevelRow[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const r = raw[i];
    out.push({
      level: Math.max(1, Number(r.level) || 1),
      install: Math.max(0, Number(r.installCostCredits) || 0),
      upgrade: Math.max(0, Number(r.upgradeCostCredits) || 0),
      pilotMin: Math.max(0, Number(r.requiredPlayerLevelMin) || 0),
      statType: String(r.requiredStatType ?? '').trim().toLowerCase(),
      statValue: Math.max(0, Number(r.requiredStatValue) || 0),
    });
  }
  return out;
}

const BY_FAC: Record<FacKey, LevelRow[]> = {
  trade_port: parseRows(FacilityTradePortLevelPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[]),
  shipyard: parseRows(FacilityShipyardLevelPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[]),
  defense_satellite: parseRows(PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[]),
  laboratory: parseRows(FacilityLaboratoryLevelPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[]),
  bar: parseRows(FacilityBarLevelPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[]),
  military_command: parseRows(FacilityMilitaryCommandLevelPolicy_FROM_BALANCE_CSV as unknown as Record<string, string>[]),
};

const STEP_SEC = new Map<number, number>();
for (const row of FacilityUpgradeDurationSteps_FROM_BALANCE_CSV) {
  if (row.duration_tier !== 'standard' || row.enabled !== 'true') continue;
  STEP_SEC.set(Number(row.target_level) || 0, Number(row.base_duration_sec) || 0);
}

const INSTALL_SEC: Record<FacKey, number> = {
  trade_port: 900,
  shipyard: 1080,
  defense_satellite: 1500,
  laboratory: 1800,
  bar: 1200,
  military_command: 1650,
};
const UPGRADE_MUL: Record<FacKey, number> = {
  trade_port: 0.95,
  shipyard: 1,
  defense_satellite: 1.05,
  laboratory: 1.1,
  bar: 0.98,
  military_command: 1.05,
};
for (const row of FacilityUpgradeDurationFacilityMod_FROM_BALANCE_CSV) {
  const k = row.facility_type as FacKey;
  if (INSTALL_SEC[k] != null) {
    INSTALL_SEC[k] = Number(row.install_duration_sec) || INSTALL_SEC[k];
    UPGRADE_MUL[k] = Number(row.upgrade_duration_mul) || UPGRADE_MUL[k];
  }
}

function facOf(moduleId: string): FacKey {
  return MODULE_FAC[moduleId] ?? 'trade_port';
}

function rowAt(fac: FacKey, level: number): LevelRow | null {
  const rows = BY_FAC[fac];
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].level === level) return rows[i];
  }
  return null;
}

export function nextDevCost(moduleId: string, currentLevel: number): number {
  const fac = facOf(moduleId);
  if (currentLevel <= 0) return rowAt(fac, 1)?.install || 500;
  return rowAt(fac, currentLevel + 1)?.upgrade || 0;
}

export function nextDevPilotMin(moduleId: string, currentLevel: number): number {
  const fac = facOf(moduleId);
  const next = currentLevel <= 0 ? 1 : currentLevel + 1;
  return rowAt(fac, next)?.pilotMin ?? 0;
}

export function nextDevStatGate(
  moduleId: string,
  currentLevel: number,
): { type: string; value: number } {
  const fac = facOf(moduleId);
  const next = currentLevel <= 0 ? 1 : currentLevel + 1;
  const row = rowAt(fac, next);
  return { type: row?.statType ?? '', value: row?.statValue ?? 0 };
}

export function durationTicks(moduleId: string, targetLevel: number): number {
  const fac = facOf(moduleId);
  const sec = targetLevel <= 1
    ? INSTALL_SEC[fac]
    : Math.floor((STEP_SEC.get(targetLevel) ?? 2700) * UPGRADE_MUL[fac]);
  return Math.max(1, Math.ceil(Math.max(1, sec) / TICK_GAME_SEC));
}

function statValue(world: WorldState, type: string): number {
  const t = type.trim().toLowerCase();
  if (t === 'technology' || t === 'tech' || t === 't') return world.focusStats.technology;
  if (t === 'resource' || t === 'r') return world.focusStats.resource;
  if (t === 'population' || t === 'p') return world.focusStats.population;
  if (t === 'defense' || t === 'd') return world.focusStats.defense;
  if (t === 'environment' || t === 'e') return world.focusStats.environment;
  return 100;
}

export function canStartDev(world: WorldState, moduleId: string): boolean {
  const lv = world.devLevels[moduleId] ?? 0;
  if (lv >= DEV_MAX_LEVEL) return false;
  if (world.level < nextDevPilotMin(moduleId, lv)) return false;
  const gate = nextDevStatGate(moduleId, lv);
  if (gate.type && gate.value > 0 && statValue(world, gate.type) < gate.value) return false;
  const cost = nextDevCost(moduleId, lv);
  return cost > 0 && world.credits >= cost;
}

/** 카탈로그 메뉴 중 가장 낮은 레벨(가능·구매 가능) — 한 줄만 올리지 않음. */
export function pickBalancedDev(world: WorldState): { id: string; labelKo: string; level: number; cost: number } | null {
  const mods = listDevModules();
  let pick = null as { id: string; labelKo: string; level: number; cost: number } | null;
  for (let i = 0; i < mods.length; i += 1) {
    const id = mods[i].id;
    if (!canStartDev(world, id)) continue;
    const level = world.devLevels[id] ?? 0;
    const cost = nextDevCost(id, level);
    if (!pick || level < pick.level || (level === pick.level && cost < pick.cost)) {
      pick = { id, labelKo: mods[i].labelKo, level, cost };
    }
  }
  return pick;
}

export function nudgeFocusStat(world: WorldState, moduleId: string): void {
  const s = world.focusStats;
  if (moduleId === 'dev_research_lab') s.technology = Math.min(100, s.technology + 1);
  else if (moduleId === 'defense_satellite') s.defense = Math.min(100, s.defense + 1);
  else if (moduleId === 'dev_population_dome') s.population = Math.min(100, s.population + 1);
  else if (moduleId === 'dev_trade_port') s.resource = Math.min(100, s.resource + 1);
  else if (moduleId === 'dev_military_command') {
    s.defense = Math.min(100, s.defense + 1);
    s.technology = Math.min(100, s.technology + 1);
  }
  else s.defense = Math.min(100, s.defense + 1);
}
