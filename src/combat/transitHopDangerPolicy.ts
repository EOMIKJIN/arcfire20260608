// ============================================================
// 이동중 전투 위험도 — 아르카디아 홉 → 정책 CSV 1행
// 시드 1회 조회. 틱·렌더 금지.
// ============================================================

import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../data/balance/generated/csvPlayScenarioZonePlanets';
import { TransitHopDangerPolicy_FROM_BALANCE_CSV } from '../data/balance/generated/csvTransitHopDangerPolicy';
import { resolveArcadiaHopDistance } from '../world/arcadiaHopDistance';

export type TransitHopDangerPolicy = {
  hopMin: number;
  hopMax: number;
  encounterChance: number;
  levelMin: number;
  levelMax: number;
  rewardTemplateId: string;
};

function num(raw: string, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let rows: TransitHopDangerPolicy[] | null = null;

function getRows(): TransitHopDangerPolicy[] {
  if (rows) return rows;
  const parsed: TransitHopDangerPolicy[] = [];
  for (const row of TransitHopDangerPolicy_FROM_BALANCE_CSV) {
    parsed.push({
      hopMin: Math.floor(num(row.hopMin, 0)),
      hopMax: Math.floor(num(row.hopMax, 0)),
      encounterChance: Math.min(1, Math.max(0, num(row.encounterChance, 0))),
      levelMin: Math.max(1, Math.floor(num(row.levelMin, 1))),
      levelMax: Math.max(1, Math.floor(num(row.levelMax, 1))),
      rewardTemplateId: String(row.rewardTemplateId ?? '').trim(),
    });
  }
  parsed.sort((a, b) => a.hopMin - b.hopMin);
  rows = parsed;
  return rows;
}

export function resolveTransitHopDangerPolicy(hop: number): TransitHopDangerPolicy {
  const list = getRows();
  const h = Number.isFinite(hop) ? Math.max(0, Math.floor(hop)) : 0;
  for (let i = 0; i < list.length; i += 1) {
    const row = list[i]!;
    if (h >= row.hopMin && h <= row.hopMax) return row;
  }
  return list[list.length - 1] ?? {
    hopMin: 7,
    hopMax: 99,
    encounterChance: 0.7,
    levelMin: 32,
    levelMax: 60,
    rewardTemplateId: 'void_wraith',
  };
}

export function resolveTransitHopDangerPolicyForSystem(
  systemId: string | null | undefined,
): TransitHopDangerPolicy {
  return resolveTransitHopDangerPolicy(resolveArcadiaHopDistance(systemId));
}

/** 함장 레벨을 그 성계 홉 대역 안으로 자른다. 무기·선체가 이 숫자를 같이 쓴다. */
export function resolveTransitHopCombatLevel(
  systemId: string | null | undefined,
  captainLevel: number | null | undefined,
): number {
  const policy = resolveTransitHopDangerPolicyForSystem(systemId);
  const raw = captainLevel == null || !Number.isFinite(captainLevel)
    ? policy.levelMin
    : Math.floor(captainLevel);
  return Math.min(policy.levelMax, Math.max(policy.levelMin, raw));
}

export function resolveTransitHopRewardTemplateId(
  systemId: string | null | undefined,
): string {
  return resolveTransitHopDangerPolicyForSystem(systemId).rewardTemplateId;
}

type LevelPlanet = { tcl: number; planetId: string };

let levelPlanetLadder: LevelPlanet[] | null = null;

function getLevelPlanetLadder(): LevelPlanet[] {
  if (levelPlanetLadder) return levelPlanetLadder;
  const ladder: LevelPlanet[] = [];
  for (const row of PlayScenarioZonePlanets_FROM_BALANCE_CSV) {
    const planetId = String(row.primaryPlanetId ?? '').trim();
    const tcl = Math.floor(num(row.targetCombatLevel, 1));
    if (!planetId) continue;
    ladder.push({ tcl: Math.max(1, tcl), planetId });
  }
  ladder.sort((a, b) => a.tcl - b.tcl || a.planetId.localeCompare(b.planetId));
  levelPlanetLadder = ladder;
  return ladder;
}

/**
 * 전투 레벨 이하의 코어 주 행성 중 TCL이 가장 높은 곳.
 * 선체 배율 표의 기존 행을 그대로 쓴다.
 */
export function resolvePlanetIdForCombatLevel(combatLevel: number): string {
  const ladder = getLevelPlanetLadder();
  if (ladder.length === 0) return '';
  const level = Math.max(1, Math.floor(combatLevel));
  let best = ladder[0]!;
  for (let i = 0; i < ladder.length; i += 1) {
    const row = ladder[i]!;
    if (row.tcl > level) break;
    best = row;
  }
  return best.planetId;
}
