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

/**
 * 전역 결정적 순서 — 모든 클라이언트 동일.
 * `preserveAlreadyUnlocked`(기본 true, 일상 진행)면 `alreadyUnlockedSynthIds`(현재 실제로 열려있는 synth)를
 * 그대로 schedule 앞부분에 고정하고 부족한 만큼만 새로 뽑는다 — baseline부터 매번 전체를 다시 계산하지
 * 않으므로 이미 개방된 성계가 재계산으로 목표 집합에서 빠져 되돌아가는 일이 없다(회귀 금지, 2026-07-28 확정).
 * `preserveAlreadyUnlocked=false`(세대/epoch hardReset 전용)면 이 접두 고정을 끄고 baseline+결정적 pick만으로
 * `maxSynthUnlockCount`개를 순수 계산한다 — 기존에 몇 개가 열려 있었든 무관하게 epoch가 요구하는 목표
 * 집합만 남기므로, 초과분은 호출측(`reconcileGlobalSynthUnlocks`)에서 정확히 잠글 수 있다.
 */
export function buildDeterministicGlobalSynthUnlockSchedule(
  systems: Record<string, StarSystem>,
  maxSynthUnlockCount: number,
  baselineUnlocked: readonly string[] = BASELINE_GAMEPLAY_SYSTEM_IDS,
  alreadyUnlockedSynthIds: readonly string[] = [],
  preserveAlreadyUnlocked: boolean = true,
): string[] {
  if (maxSynthUnlockCount <= 0) return [];
  const unlocked = new Set(baselineUnlocked);
  const schedule: string[] = [];
  if (preserveAlreadyUnlocked) {
    for (const id of alreadyUnlockedSynthIds) {
      if (unlocked.has(id)) continue;
      unlocked.add(id);
      schedule.push(id);
    }
  }
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
  alreadyUnlockedSynthIds: readonly string[] = [],
  /** false면 세대/epoch hardReset 전용 순수 재계산(접두 고정 없음) */
  preserveAlreadyUnlocked: boolean = true,
): { targetCount: number; targetSynthIds: string[] } {
  const targetCount = computeGlobalSynthUnlockTargetCount(policy, nowMs);
  const targetSynthIds = buildDeterministicGlobalSynthUnlockSchedule(
    systems,
    targetCount,
    undefined,
    alreadyUnlockedSynthIds,
    preserveAlreadyUnlocked,
  );
  return { targetCount, targetSynthIds };
}
