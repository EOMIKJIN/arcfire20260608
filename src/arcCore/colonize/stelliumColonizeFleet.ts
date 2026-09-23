/**
 * 개척선 대수·속도 — 현재 기본 1대·배율 1.
 * 이후 스킬 `colonize_ship_count` / `colonize_speed` 가 붙으면 여기만 읽으면 된다.
 */
import { resolveStelliumColonizePolicy } from './stelliumColonizePolicy';
import type { StelliumColonizePolicy } from './stelliumColonizeTypes';

export const STELLIUM_COLONIZE_SHIP_COUNT_STAT = 'colonize_ship_count';
export const STELLIUM_COLONIZE_SPEED_STAT = 'colonize_speed';

export type StelliumColonizeFleetProgress = {
  /** 행성 1곳 표시 대수 — 현재 1 */
  shipCount: number;
  /** 전역 동시 운용 캡 — 현재 3. 확대는 향후 */
  operationalCap: number;
  speedMul: number;
  outpostArriveSec: number;
  handoffSec: number;
};

function readOwnedSkillIds(ownedSkillIds?: readonly string[]): readonly string[] {
  if (ownedSkillIds) return ownedSkillIds;
  try {
    const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
    return usePlayerStore.getState().player?.skills ?? [];
  } catch {
    return [];
  }
}

function readStat(statKey: string, ownedSkillIds: readonly string[]): number {
  try {
    const { sumOwnedSkillStatBonus } =
      require('../../game/ownedSkillStatBonus') as typeof import('../../game/ownedSkillStatBonus');
    return Math.max(0, sumOwnedSkillStatBonus(statKey, ownedSkillIds));
  } catch {
    return 0;
  }
}

export function scaleStelliumColonizeTravelDays(baseDays: number, speedMul: number): number {
  const days = Math.max(1, Math.floor(baseDays));
  const mul = Math.max(1, speedMul);
  return Math.max(1, Math.ceil(days / mul));
}

export function resolveStelliumColonizeFleet(
  policy: StelliumColonizePolicy = resolveStelliumColonizePolicy(),
  ownedSkillIds?: readonly string[],
): StelliumColonizeFleetProgress {
  const owned = readOwnedSkillIds(ownedSkillIds);
  const extraShips = Math.floor(readStat(STELLIUM_COLONIZE_SHIP_COUNT_STAT, owned));
  const extraSpeed = readStat(STELLIUM_COLONIZE_SPEED_STAT, owned);
  const shipCount = Math.max(1, Math.min(1, policy.baseShipCount));
  const operationalCap = Math.max(
    1,
    Math.min(policy.maxShipCount, policy.concurrentInFlightCap + extraShips),
  );
  const speedMul = Math.max(1, Math.min(3, policy.baseSpeedMul + extraSpeed));
  const outpostArriveSec = Math.max(30, Math.floor(policy.outpostArriveSec / speedMul));
  const handoffSec = Math.max(0, Math.floor(policy.handoffSec / speedMul));
  return { shipCount, operationalCap, speedMul, outpostArriveSec, handoffSec };
}
