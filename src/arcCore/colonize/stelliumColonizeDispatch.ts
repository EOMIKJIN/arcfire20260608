/**
 * 전역 개척선 슬롯 — 현재 최대 3대.
 * 임무 종료 후 handoffSec(5분) 지나야 다음 대기 성계로 출항.
 * 선택: 최단 홉 우선 · 동률은 시드 해시(결정적).
 */
import { meetsStelliumColonizeHqDefenseSat } from './stelliumColonizeDefenseSat';
import {
  isStelliumColonizeActivePhase,
  type StelliumColonizeEvent,
  type StelliumColonizeRecord,
} from './stelliumColonizeTypes';
import { addKstDayKey } from './stelliumColonizeDayKey';
import type { StelliumColonizeFiscalHooks } from './stelliumColonizeFiscal';

function countActive(records: Readonly<Record<string, StelliumColonizeRecord>>): number {
  let n = 0;
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    if (isStelliumColonizeActivePhase(records[keys[i]]?.phase)) n += 1;
  }
  return n;
}

export type StelliumColonizeHandoffCandidate = {
  planetId: string;
  hopDistance: number;
};

export function resolveOperationalShipCap(input: {
  concurrentInFlightCap: number;
  maxShipCount: number;
}): number {
  return Math.max(1, Math.min(input.maxShipCount, input.concurrentInFlightCap));
}

export function seedFleetReadyAtMs(
  readyAtMs: readonly number[] | null | undefined,
  cap: number,
  activeCount: number,
): number[] {
  if (readyAtMs) return readyAtMs.slice();
  const idle = Math.max(0, cap - activeCount);
  const out: number[] = [];
  for (let i = 0; i < idle; i += 1) out.push(0);
  return out;
}

export function countReadyShips(readyAtMs: readonly number[], nowMs: number): number {
  let n = 0;
  for (let i = 0; i < readyAtMs.length; i += 1) {
    if (readyAtMs[i] <= nowMs) n += 1;
  }
  return n;
}

export function consumeReadyShip(
  readyAtMs: readonly number[],
  nowMs: number,
): { next: number[]; consumed: boolean } {
  let best = -1;
  let bestAt = Number.POSITIVE_INFINITY;
  for (let i = 0; i < readyAtMs.length; i += 1) {
    const at = readyAtMs[i];
    if (at > nowMs) continue;
    if (at < bestAt) {
      bestAt = at;
      best = i;
    }
  }
  if (best < 0) return { next: readyAtMs.slice(), consumed: false };
  const next = readyAtMs.slice();
  next.splice(best, 1);
  return { next, consumed: true };
}

export function pushHandoffReadyAt(
  readyAtMs: readonly number[],
  nowMs: number,
  handoffSec: number,
): number[] {
  const wait = Math.max(0, Math.floor(handoffSec)) * 1000;
  return [...readyAtMs, nowMs + wait];
}

export function earliestFleetReadyAtMs(readyAtMs: readonly number[]): number | null {
  if (readyAtMs.length === 0) return null;
  let min = readyAtMs[0]!;
  for (let i = 1; i < readyAtMs.length; i += 1) {
    if (readyAtMs[i]! < min) min = readyAtMs[i]!;
  }
  return min;
}

function hashPick01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** 최단 홉 우선, 동률은 seed 해시로 1개 */
export function pickNextHandoffTarget(
  candidates: readonly StelliumColonizeHandoffCandidate[],
  seed: string,
): StelliumColonizeHandoffCandidate | null {
  if (candidates.length === 0) return null;
  let minHop = candidates[0]!.hopDistance;
  for (let i = 1; i < candidates.length; i += 1) {
    if (candidates[i]!.hopDistance < minHop) minHop = candidates[i]!.hopDistance;
  }
  const tied: StelliumColonizeHandoffCandidate[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    if (candidates[i]!.hopDistance === minHop) tied.push(candidates[i]!);
  }
  if (tied.length === 1) return tied[0]!;
  const idx = Math.floor(hashPick01(seed) * tied.length) % tied.length;
  return tied[idx]!;
}

export function listQueuedHandoffCandidates(
  records: Readonly<Record<string, StelliumColonizeRecord>>,
): StelliumColonizeHandoffCandidate[] {
  const out: StelliumColonizeHandoffCandidate[] = [];
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    const row = records[keys[i]];
    if (!row || row.phase !== 'queued') continue;
    out.push({ planetId: row.planetId, hopDistance: row.hopDistance });
  }
  return out;
}

export function dispatchReadyColonizers(input: {
  records: Record<string, StelliumColonizeRecord>;
  fleetReadyAtMs: number[];
  nowMs: number;
  todayKey: string;
  cap: number;
  outpostArriveSec: number;
  pickSeed: string;
  requiredDefenseSatLevel?: number;
  resolveDefenseSatLevel?: (planetId: string) => number;
  fiscal?: StelliumColonizeFiscalHooks | null;
}): {
  records: Record<string, StelliumColonizeRecord>;
  fleetReadyAtMs: number[];
  events: StelliumColonizeEvent[];
} {
  const events: StelliumColonizeEvent[] = [];
  let records = input.records;
  let ready = input.fleetReadyAtMs.slice();
  const outpostArriveSec = Math.max(30, Math.floor(input.outpostArriveSec));

  const requiredSat = Math.max(0, Math.floor(input.requiredDefenseSatLevel ?? 0));
  const resolveSat = input.resolveDefenseSatLevel;
  while (countActive(records) < input.cap) {
    const queuedAll = listQueuedHandoffCandidates(records);
    const queued = requiredSat <= 0 || !resolveSat
      ? queuedAll
      : queuedAll.filter((c) => meetsStelliumColonizeHqDefenseSat(requiredSat, resolveSat(c.planetId)));
    if (queued.length === 0) break;
    const consume = consumeReadyShip(ready, input.nowMs);
    if (!consume.consumed) break;
    const pick = pickNextHandoffTarget(
      queued,
      `${input.pickSeed}:${Object.keys(records).length}:${ready.length}`,
    );
    if (!pick) break;
    const row = records[pick.planetId];
    if (!row || row.phase !== 'queued') break;
    ready = consume.next;
    const promoted: StelliumColonizeRecord = {
      ...row,
      phase: 'in_flight',
      departedDayKey: input.todayKey,
      dueDayKey: addKstDayKey(input.todayKey, row.travelDays),
      outpostDueAtMs: input.nowMs + outpostArriveSec * 1000,
    };
    records = { ...records, [row.planetId]: promoted };
    events.push({ kind: 'departed', planetId: row.planetId });
  }

  return { records, fleetReadyAtMs: ready, events };
}
