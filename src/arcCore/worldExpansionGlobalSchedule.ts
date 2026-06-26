import { GAMEPLAY_SYSTEM_IDS } from '../data/galaxy100';
import type { StarSystem } from '../types';
import { formatArcCoreOpsDayKey } from './schedule/arcCoreDailyOpsPolicy';
import { pickDeterministicSynthFrontierCandidate } from './worldExpansionFrontier';
import type { ArcCoreWorldExpansionGlobalPolicy } from './worldExpansionGlobalPolicy';

export const BASELINE_GAMEPLAY_SYSTEM_IDS = Array.from(GAMEPLAY_SYSTEM_IDS);

/** YYYY-MM-DD 두 키 사이 달력일 수(동일=0, epoch=오늘이면 0) */
export function calendarDaysBetweenDayKeys(startKey: string, endKey: string): number {
  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  return Math.floor((endUtc - startUtc) / (24 * 60 * 60 * 1000));
}

/** epoch 당일=1개, 9일차=9개 (systemsPerDay=1 기준) */
export function computeGlobalSynthUnlockTargetCount(
  policy: Pick<
    ArcCoreWorldExpansionGlobalPolicy,
    'epochDayKey' | 'timeZone' | 'systemsPerDay'
  >,
  nowMs: number,
): number {
  const todayKey = formatArcCoreOpsDayKey(nowMs, policy.timeZone);
  if (todayKey < policy.epochDayKey) return 0;
  const elapsedDays = calendarDaysBetweenDayKeys(policy.epochDayKey, todayKey) + 1;
  return Math.max(0, elapsedDays * policy.systemsPerDay);
}

/** 전역 결정적 순서 — 모든 클라이언트 동일 */
export function buildDeterministicGlobalSynthUnlockSchedule(
  systems: Record<string, StarSystem>,
  maxSynthUnlockCount: number,
  baselineUnlocked: readonly string[] = BASELINE_GAMEPLAY_SYSTEM_IDS,
): string[] {
  if (maxSynthUnlockCount <= 0) return [];
  const unlocked = new Set(baselineUnlocked);
  const schedule: string[] = [];
  while (schedule.length < maxSynthUnlockCount) {
    const pick = pickDeterministicSynthFrontierCandidate(systems, [...unlocked]);
    if (!pick) break;
    unlocked.add(pick);
    schedule.push(pick);
  }
  return schedule;
}

export function buildGlobalSynthUnlockTargetIds(
  systems: Record<string, StarSystem>,
  policy: ArcCoreWorldExpansionGlobalPolicy,
  nowMs: number,
): { targetCount: number; targetSynthIds: string[] } {
  const targetCount = computeGlobalSynthUnlockTargetCount(policy, nowMs);
  const targetSynthIds = buildDeterministicGlobalSynthUnlockSchedule(systems, targetCount);
  return { targetCount, targetSynthIds };
}
