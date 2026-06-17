// ============================================================
// 아크코어 행성 공격 레벨 정책 (1~5) 리졸버 — Table-First (기반작업 · inert)
// arc_core_planet_attack_level_policy.csv 의 레벨별 배수를 읽어,
// 드론 정책/피해 intensity/일반전투/이동전투에 적용할 effective 값을 만든다.
// 레벨 1(BASELINE)은 모든 배수 1.0 → 현재 동작과 100% 동일.
// effective 값은 ARC_ATTACK_SAFETY 하드 상한으로 클램프되어 확장이 구조적으로 안전하다.
// 아직 어떤 런타임 경로도 본 모듈을 호출하지 않는다(동작 변화 없음).
// ============================================================

import { ArcCorePlanetAttackLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import {
  getArcCoreInboundDronePolicy,
  type ArcCoreInboundDronePolicy,
} from '../balance/arcCoreInboundDronePolicy';
import {
  ARC_ATTACK_LEVEL_BASELINE,
  ARC_ATTACK_SAFETY,
  clampArcAttackLevel,
} from './arcCoreAttackModel';

export type ArcCorePlanetAttackLevelRow = {
  level: number;
  waveIntervalMul: number;
  waveCountMul: number;
  droneHpMul: number;
  inboundDurationMul: number;
  maxActiveDronesMul: number;
  impactIntensityMul: number;
  dailyEventCapMul: number;
  generalCombatLevelMul: number;
  transitEncounterMul: number;
  notesKo: string;
};

type RawRow = {
  attack_level?: string;
  wave_interval_mul?: string;
  wave_count_mul?: string;
  drone_hp_mul?: string;
  inbound_duration_mul?: string;
  max_active_drones_mul?: string;
  impact_intensity_mul?: string;
  daily_event_cap_mul?: string;
  general_combat_level_mul?: string;
  transit_encounter_mul?: string;
  notesKo?: string;
};

/** 배수는 0보다 커야 하며, 파싱 실패 시 1.0(중립) */
function mul(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseRow(raw: RawRow): ArcCorePlanetAttackLevelRow {
  return {
    level: clampArcAttackLevel(Number(raw.attack_level) || ARC_ATTACK_LEVEL_BASELINE),
    waveIntervalMul: mul(raw.wave_interval_mul),
    waveCountMul: mul(raw.wave_count_mul),
    droneHpMul: mul(raw.drone_hp_mul),
    inboundDurationMul: mul(raw.inbound_duration_mul),
    maxActiveDronesMul: mul(raw.max_active_drones_mul),
    impactIntensityMul: mul(raw.impact_intensity_mul),
    dailyEventCapMul: mul(raw.daily_event_cap_mul),
    generalCombatLevelMul: mul(raw.general_combat_level_mul),
    transitEncounterMul: mul(raw.transit_encounter_mul),
    notesKo: String(raw.notesKo ?? ''),
  };
}

/** 모든 배수 1.0 — CSV에 해당 레벨 행이 없을 때의 안전 폴백(중립=현재 동작) */
function neutralRow(level: number): ArcCorePlanetAttackLevelRow {
  return {
    level: clampArcAttackLevel(level),
    waveIntervalMul: 1,
    waveCountMul: 1,
    droneHpMul: 1,
    inboundDurationMul: 1,
    maxActiveDronesMul: 1,
    impactIntensityMul: 1,
    dailyEventCapMul: 1,
    generalCombatLevelMul: 1,
    transitEncounterMul: 1,
    notesKo: '',
  };
}

let cachedByLevel: Map<number, ArcCorePlanetAttackLevelRow> | null = null;

function rowsByLevel(): Map<number, ArcCorePlanetAttackLevelRow> {
  if (cachedByLevel) return cachedByLevel;
  const map = new Map<number, ArcCorePlanetAttackLevelRow>();
  for (const raw of ArcCorePlanetAttackLevelPolicy_FROM_BALANCE_CSV as readonly RawRow[]) {
    const row = parseRow(raw);
    map.set(row.level, row);
  }
  cachedByLevel = map;
  return map;
}

export function getArcCorePlanetAttackLevelPolicy(level: number): ArcCorePlanetAttackLevelRow {
  const lv = clampArcAttackLevel(level);
  return rowsByLevel().get(lv) ?? neutralRow(lv);
}

/**
 * 레벨에 따른 effective inbound 드론 정책.
 * baseline(레벨1)은 base CSV와 동일값을 반환한다.
 * 상향 시에도 ARC_ATTACK_SAFETY 하드 상한으로 클램프되어 동시 객체·스폰 빈도가 안전하게 제한된다.
 */
export function resolveEffectiveInboundDronePolicy(level: number): ArcCoreInboundDronePolicy {
  const base = getArcCoreInboundDronePolicy();
  const row = getArcCorePlanetAttackLevelPolicy(level);
  return {
    ...base,
    waveIntervalSec: Math.max(
      ARC_ATTACK_SAFETY.WAVE_INTERVAL_MIN_SEC,
      base.waveIntervalSec * row.waveIntervalMul,
    ),
    waveCount: Math.min(
      ARC_ATTACK_SAFETY.WAVE_COUNT_CEIL,
      Math.max(1, Math.round(base.waveCount * row.waveCountMul)),
    ),
    droneHp: Math.max(1, Math.round(base.droneHp * row.droneHpMul)),
    inboundDurationSec: Math.max(1, base.inboundDurationSec * row.inboundDurationMul),
    maxActiveDrones: Math.min(
      ARC_ATTACK_SAFETY.MAX_ACTIVE_DRONES_CEIL,
      Math.max(1, Math.round(base.maxActiveDrones * row.maxActiveDronesMul)),
    ),
  };
}

/** applyPlanetAttackCoreDamage 의 intensityMul 로 넘길 피해 강도 배수 */
export function resolveAttackIntensityMul(level: number): number {
  return getArcCorePlanetAttackLevelPolicy(level).impactIntensityMul;
}

/** 일일 이벤트 캡 배수 (캡 자체는 정수 floor 유지는 호출부 책임) */
export function resolveAttackDailyCapMul(level: number): number {
  return getArcCorePlanetAttackLevelPolicy(level).dailyEventCapMul;
}

/** 메인스테이지 일반전투 강도 배수 (targetCombatLevel 등에 적용 — 추후) */
export function resolveGeneralCombatLevelMul(level: number): number {
  return getArcCorePlanetAttackLevelPolicy(level).generalCombatLevelMul;
}

/** 이동중 전투 조우 확률 배수 (추후 worldmap 하드코딩 대체) */
export function resolveTransitEncounterMul(level: number): number {
  return getArcCorePlanetAttackLevelPolicy(level).transitEncounterMul;
}
