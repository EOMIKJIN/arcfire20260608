// ============================================================
// v3.1 — 행성 시설 설치·업그레이드 시간 정본 (BM 핵심 · Table-First)
// tables/balance/facility_upgrade_duration_*.csv
// ============================================================

import {
  FacilityUpgradeDurationFacilityMod_FROM_BALANCE_CSV,
  FacilityUpgradeDurationGlobal_FROM_BALANCE_CSV,
  FacilityUpgradeDurationSteps_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

import type { PlanetFacilityDurationTier } from '../../store/planetCoreMetricTypes';

export type { PlanetFacilityDurationTier };

export type FacilityUpgradeDurationGlobal = {
  activeDurationTier: PlanetFacilityDurationTier;
  standardMaxTargetLevel: number;
  epicMaxTargetLevel: number;
  minInstallDurationSec: number;
  maxInstallDurationSec: number;
  standardMaxUpgradeDurationSec: number;
  epicDurationMultiplier: number;
};

export type FacilityUpgradeDurationStep = {
  durationTier: PlanetFacilityDurationTier;
  targetLevel: number;
  baseDurationSec: number;
  enabled: boolean;
  notesKo: string;
};

export type FacilityUpgradeDurationFacilityMod = {
  facilityType: string;
  installDurationSec: number;
  upgradeDurationMul: number;
  notesKo: string;
};

let cachedGlobal: FacilityUpgradeDurationGlobal | null = null;
let cachedSteps: FacilityUpgradeDurationStep[] | null = null;
let cachedFacilityMods: FacilityUpgradeDurationFacilityMod[] | null = null;

function parseBool(raw: string | undefined): boolean {
  const v = String(raw ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function parseTier(raw: string | undefined): PlanetFacilityDurationTier {
  return String(raw ?? '').trim().toLowerCase() === 'epic' ? 'epic' : 'standard';
}

export function getFacilityUpgradeDurationGlobal(): FacilityUpgradeDurationGlobal {
  if (cachedGlobal) return cachedGlobal;
  const map = new Map<string, { num: number; str: string }>();
  for (const row of FacilityUpgradeDurationGlobal_FROM_BALANCE_CSV) {
    map.set(String(row.key ?? ''), {
      num: Number(row.value_num),
      str: String(row.value_str ?? ''),
    });
  }
  const readNum = (key: string, fallback: number) => {
    const v = map.get(key)?.num;
    if (v === undefined || !Number.isFinite(v)) return fallback;
    return Math.max(0, Math.floor(v));
  };
  const readStr = (key: string, fallback: string) => map.get(key)?.str.trim() || fallback;
  cachedGlobal = {
    activeDurationTier: parseTier(readStr('active_duration_tier', 'standard')),
    standardMaxTargetLevel: readNum('standard_max_target_level', 10),
    epicMaxTargetLevel: readNum('epic_max_target_level', 12),
    minInstallDurationSec: readNum('min_install_duration_sec', 900),
    maxInstallDurationSec: readNum('max_install_duration_sec', 1800),
    standardMaxUpgradeDurationSec: readNum('standard_max_upgrade_duration_sec', 2592000),
    epicDurationMultiplier: Math.max(1, Number(map.get('epic_duration_multiplier')?.num) || 2),
  };
  return cachedGlobal;
}

export function listFacilityUpgradeDurationSteps(): FacilityUpgradeDurationStep[] {
  if (cachedSteps) return cachedSteps;
  cachedSteps = FacilityUpgradeDurationSteps_FROM_BALANCE_CSV.map((raw) => ({
    durationTier: parseTier(raw.duration_tier),
    targetLevel: Math.max(1, Math.floor(Number(raw.target_level) || 1)),
    baseDurationSec: Math.max(0, Math.floor(Number(raw.base_duration_sec) || 0)),
    enabled: parseBool(raw.enabled),
    notesKo: String(raw.notesKo ?? ''),
  }));
  return cachedSteps;
}

export function listFacilityUpgradeDurationFacilityMods(): FacilityUpgradeDurationFacilityMod[] {
  if (cachedFacilityMods) return cachedFacilityMods;
  cachedFacilityMods = FacilityUpgradeDurationFacilityMod_FROM_BALANCE_CSV.map((raw) => ({
    facilityType: String(raw.facility_type ?? '').trim(),
    installDurationSec: Math.max(0, Math.floor(Number(raw.install_duration_sec) || 0)),
    upgradeDurationMul: Math.max(0.01, Number(raw.upgrade_duration_mul) || 1),
    notesKo: String(raw.notesKo ?? ''),
  }));
  return cachedFacilityMods;
}

export function getFacilityUpgradeDurationFacilityMod(facilityType: string): FacilityUpgradeDurationFacilityMod | null {
  return listFacilityUpgradeDurationFacilityMods().find((r) => r.facilityType === facilityType) ?? null;
}

function getDurationStep(
  tier: PlanetFacilityDurationTier,
  targetLevel: number,
): FacilityUpgradeDurationStep | null {
  return listFacilityUpgradeDurationSteps().find(
    (s) => s.durationTier === tier && s.targetLevel === targetLevel,
  ) ?? null;
}

function clampInstallSec(sec: number): number {
  const g = getFacilityUpgradeDurationGlobal();
  if (sec <= 0) return g.minInstallDurationSec;
  return Math.max(g.minInstallDurationSec, Math.min(g.maxInstallDurationSec, sec));
}

function clampUpgradeSec(sec: number, tier: PlanetFacilityDurationTier): number {
  const g = getFacilityUpgradeDurationGlobal();
  if (tier === 'epic') {
    const epicCap = Math.floor(g.standardMaxUpgradeDurationSec * g.epicDurationMultiplier);
    return Math.max(0, Math.min(epicCap, sec));
  }
  return Math.max(0, Math.min(g.standardMaxUpgradeDurationSec, sec));
}

function resolveMaxTargetLevel(tier: PlanetFacilityDurationTier): number {
  const g = getFacilityUpgradeDurationGlobal();
  return tier === 'epic' ? g.epicMaxTargetLevel : g.standardMaxTargetLevel;
}

/** Lv0→1 최초 설치 시간(초) — facility_mod + global 15~30분 클램프 */
export function resolvePlanetFacilityInstallDurationSec(facilityType: string): number {
  const mod = getFacilityUpgradeDurationFacilityMod(facilityType);
  return clampInstallSec(mod?.installDurationSec ?? getFacilityUpgradeDurationGlobal().minInstallDurationSec);
}

export type ResolvePlanetFacilityUpgradeDurationOpts = {
  /** omit → global active_duration_tier */
  durationTier?: PlanetFacilityDurationTier;
};

/** currentLevel → currentLevel+1 업그레이드 시간(초) */
export function resolvePlanetFacilityUpgradeDurationSec(
  facilityType: string,
  currentLevel: number,
  opts?: ResolvePlanetFacilityUpgradeDurationOpts,
): number | null {
  const g = getFacilityUpgradeDurationGlobal();
  const tier = opts?.durationTier ?? g.activeDurationTier;
  const targetLevel = Math.floor(currentLevel) + 1;
  if (targetLevel <= 1) return null;
  if (targetLevel > resolveMaxTargetLevel(tier)) return null;

  const step = getDurationStep(tier, targetLevel);
  if (!step || !step.enabled || step.baseDurationSec <= 0) return null;

  const mod = getFacilityUpgradeDurationFacilityMod(facilityType);
  let sec = Math.floor(step.baseDurationSec * (mod?.upgradeDurationMul ?? 1));
  if (tier === 'epic') {
    sec = Math.floor(sec * g.epicDurationMultiplier);
  }
  return clampUpgradeSec(sec, tier);
}

export function resolveActivePlanetFacilityDurationTier(): PlanetFacilityDurationTier {
  return getFacilityUpgradeDurationGlobal().activeDurationTier;
}

export function isEpicFacilityUpgradeStepEnabled(targetLevel: number): boolean {
  const step = getDurationStep('epic', targetLevel);
  return !!step?.enabled && step.baseDurationSec > 0;
}

export function listStandardUpgradeDurationsForFacility(facilityType: string): { targetLevel: number; durationSec: number }[] {
  const out: { targetLevel: number; durationSec: number }[] = [];
  for (let lv = 1; lv < getFacilityUpgradeDurationGlobal().standardMaxTargetLevel; lv += 1) {
    const sec = resolvePlanetFacilityUpgradeDurationSec(facilityType, lv, { durationTier: 'standard' });
    if (sec != null && sec > 0) {
      out.push({ targetLevel: lv + 1, durationSec: sec });
    }
  }
  return out;
}
