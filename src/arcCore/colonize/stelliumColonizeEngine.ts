import {
  meetsStelliumColonizeHqDefenseSat,
  resolveStelliumColonizeDefenseSatLevel,
} from './stelliumColonizeDefenseSat';
import { addKstDayKey, isKstDayKeyDue } from './stelliumColonizeDayKey';
import {
  STELLIUM_COLONIZE_FACTION_ID,
  isStelliumColonizeActivePhase,
  travelDaysForHopDistance,
  type StelliumColonizeCoreGauges,
  type StelliumColonizeEvent,
  type StelliumColonizePolicy,
  type StelliumColonizeRecord,
} from './stelliumColonizeTypes';
import { shouldStelliumColonizeHqSucceed } from './stelliumColonizeProbability';
import {
  consumeReadyShip,
  dispatchReadyColonizers,
  pushHandoffReadyAt,
  resolveOperationalShipCap,
  seedFleetReadyAtMs,
} from './stelliumColonizeDispatch';
import type { StelliumColonizeFiscalHooks } from './stelliumColonizeFiscal';

const CATCH_UP_ATTEMPT_CAP = 8;

export function countInFlight(records: Readonly<Record<string, StelliumColonizeRecord>>): number {
  let n = 0;
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    if (isStelliumColonizeActivePhase(records[keys[i]]?.phase)) n += 1;
  }
  return n;
}

export function enqueueStelliumColonizeRecord(input: {
  records: Record<string, StelliumColonizeRecord>;
  planetId: string;
  systemId: string;
  hopDistance: number;
  todayKey: string;
  policy: StelliumColonizePolicy;
  nowMs?: number;
  travelDays?: number;
  outpostArriveSec?: number;
  fleetReadyAtMs?: number[] | null;
  operationalCap?: number;
  defenseSatLevel?: number;
  fiscal?: StelliumColonizeFiscalHooks | null;
}): {
  records: Record<string, StelliumColonizeRecord>;
  events: StelliumColonizeEvent[];
  fleetReadyAtMs: number[];
} {
  const planetId = input.planetId.trim();
  const cap = Math.max(
    1,
    Math.floor(input.operationalCap ?? resolveOperationalShipCap(input.policy)),
  );
  const nowMs = input.nowMs ?? Date.now();
  let ready = seedFleetReadyAtMs(
    input.fleetReadyAtMs,
    cap,
    countInFlight(input.records),
  );
  if (!planetId || input.records[planetId]) {
    return { records: input.records, events: [], fleetReadyAtMs: ready };
  }
  const travelDays = Math.max(
    1,
    Math.floor(input.travelDays ?? travelDaysForHopDistance(input.hopDistance, input.policy)),
  );
  const outpostArriveSec = Math.max(
    30,
    Math.floor(input.outpostArriveSec ?? input.policy.outpostArriveSec),
  );
  const satLevel = Math.max(
    0,
    Math.floor(input.defenseSatLevel ?? resolveStelliumColonizeDefenseSatLevel(planetId)),
  );
  const satOk = meetsStelliumColonizeHqDefenseSat(input.policy.requireDefenseSatLevel, satLevel);
  const consume = consumeReadyShip(ready, nowMs);
  const slotOk = satOk && consume.consumed && countInFlight(input.records) < cap;
  // 5분 접근은 방위위성+슬롯만. 블루 금고 선지급은 사령부 롤에만.
  const canDepart = slotOk;
  if (canDepart) ready = consume.next;
  const next: StelliumColonizeRecord = {
    planetId,
    systemId: input.systemId,
    factionId: STELLIUM_COLONIZE_FACTION_ID,
    phase: canDepart ? 'in_flight' : 'queued',
    hopDistance: input.hopDistance,
    travelDays,
    attempt: 0,
    departedDayKey: canDepart ? input.todayKey : null,
    dueDayKey: canDepart ? addKstDayKey(input.todayKey, travelDays) : null,
    outpostDueAtMs: canDepart ? nowMs + outpostArriveSec * 1000 : null,
    lastOpexDayKey: null,
  };
  const events: StelliumColonizeEvent[] = [
    { kind: 'enqueued', planetId, phase: next.phase },
  ];
  if (canDepart) events.push({ kind: 'departed', planetId });
  return {
    records: { ...input.records, [planetId]: next },
    events,
    fleetReadyAtMs: ready,
  };
}

function resolveHqAttempt(
  row: StelliumColonizeRecord,
  attemptDayKey: string,
  gauges: StelliumColonizeCoreGauges,
  policy: StelliumColonizePolicy,
): { next: StelliumColonizeRecord; event: StelliumColonizeEvent } {
  const attempt = row.attempt + 1;
  const roll = shouldStelliumColonizeHqSucceed({
    dayKey: attemptDayKey,
    planetId: row.planetId,
    attempt,
    gauges,
    policy,
  });
  if (roll.success) {
    const next: StelliumColonizeRecord = {
      ...row,
      phase: 'success',
      attempt,
      dueDayKey: null,
      outpostDueAtMs: null,
    };
    return {
      next,
      event: {
        kind: 'hq_success',
        planetId: row.planetId,
        systemId: row.systemId,
        attempt,
      },
    };
  }
  const nextDue = addKstDayKey(attemptDayKey, row.travelDays);
  const next: StelliumColonizeRecord = {
    ...row,
    phase: 'fail_wait',
    attempt,
    dueDayKey: nextDue,
  };
  return {
    next,
    event: {
      kind: 'hq_fail',
      planetId: row.planetId,
      attempt,
      nextDueDayKey: nextDue,
    },
  };
}

/** 방위위성 미달 in_flight — 접근 취소, 슬롯 즉시 반환 */
export function recallStelliumColonizeUnguardedApproaches(input: {
  records: Record<string, StelliumColonizeRecord>;
  fleetReadyAtMs: number[];
  nowMs: number;
  requiredDefenseSatLevel: number;
  resolveDefenseSatLevel: (planetId: string) => number;
}): {
  records: Record<string, StelliumColonizeRecord>;
  fleetReadyAtMs: number[];
  events: StelliumColonizeEvent[];
} {
  const events: StelliumColonizeEvent[] = [];
  let next = input.records;
  let ready = input.fleetReadyAtMs.slice();
  const keys = Object.keys(next);
  for (let i = 0; i < keys.length; i += 1) {
    const row = next[keys[i]];
    if (!row || row.phase !== 'in_flight') continue;
    if (meetsStelliumColonizeHqDefenseSat(
      input.requiredDefenseSatLevel,
      input.resolveDefenseSatLevel(row.planetId),
    )) {
      continue;
    }
    next = {
      ...next,
      [row.planetId]: {
        ...row,
        phase: 'queued',
        departedDayKey: null,
        dueDayKey: null,
        outpostDueAtMs: null,
      },
    };
    ready.push(input.nowMs);
    events.push({ kind: 'approach_held', planetId: row.planetId });
  }
  return { records: next, fleetReadyAtMs: ready, events };
}

/** 5분 전초기지 도착 — 벽시계. 레거시 in_flight(무 due)는 즉시 전초기지 */
export function tickStelliumColonizeOutpost(input: {
  records: Record<string, StelliumColonizeRecord>;
  nowMs: number;
}): { records: Record<string, StelliumColonizeRecord>; events: StelliumColonizeEvent[] } {
  const events: StelliumColonizeEvent[] = [];
  let next = input.records;
  const keys = Object.keys(next);
  for (let i = 0; i < keys.length; i += 1) {
    const row = next[keys[i]];
    if (!row || row.phase !== 'in_flight') continue;
    const dueAt = row.outpostDueAtMs;
    const arrived = dueAt == null || input.nowMs >= dueAt;
    if (!arrived) continue;
    next = {
      ...next,
      [row.planetId]: {
        ...row,
        phase: 'outpost',
        outpostDueAtMs: dueAt ?? input.nowMs,
      },
    };
    events.push({ kind: 'outpost_established', planetId: row.planetId });
  }
  return { records: next, events };
}

export function tickStelliumColonizeDay(input: {
  records: Record<string, StelliumColonizeRecord>;
  todayKey: string;
  policy: StelliumColonizePolicy;
  resolveGauges: (planetId: string) => StelliumColonizeCoreGauges;
  resolveDefenseSatLevel?: (planetId: string) => number;
  nowMs?: number;
  outpostArriveSec?: number;
  fleetReadyAtMs?: number[] | null;
  handoffSec?: number;
  operationalCap?: number;
  fiscal?: StelliumColonizeFiscalHooks | null;
}): {
  records: Record<string, StelliumColonizeRecord>;
  events: StelliumColonizeEvent[];
  fleetReadyAtMs: number[];
} {
  const events: StelliumColonizeEvent[] = [];
  const nowMs = input.nowMs ?? Date.now();
  const outpostArriveSec = Math.max(
    30,
    Math.floor(input.outpostArriveSec ?? input.policy.outpostArriveSec),
  );
  const handoffSec = Math.max(0, Math.floor(input.handoffSec ?? input.policy.handoffSec));
  const cap = Math.max(
    1,
    Math.floor(input.operationalCap ?? resolveOperationalShipCap(input.policy)),
  );
  const resolveDefenseSatLevel = input.resolveDefenseSatLevel ?? resolveStelliumColonizeDefenseSatLevel;
  let ready = seedFleetReadyAtMs(
    input.fleetReadyAtMs,
    cap,
    countInFlight(input.records),
  );
  const recalled = recallStelliumColonizeUnguardedApproaches({
    records: input.records,
    fleetReadyAtMs: ready,
    nowMs,
    requiredDefenseSatLevel: input.policy.requireDefenseSatLevel,
    resolveDefenseSatLevel,
  });
  events.push(...recalled.events);
  ready = recalled.fleetReadyAtMs;
  const afterOutpost = tickStelliumColonizeOutpost({
    records: recalled.records,
    nowMs,
  });
  events.push(...afterOutpost.events);
  let next = afterOutpost.records;
  const keys = Object.keys(next);
  for (let i = 0; i < keys.length; i += 1) {
    const row = next[keys[i]];
    if (!row) continue;
    if (row.phase !== 'outpost' && row.phase !== 'fail_wait') continue;
    if (!isKstDayKeyDue(row.dueDayKey, input.todayKey)) continue;
    if (!meetsStelliumColonizeHqDefenseSat(
      input.policy.requireDefenseSatLevel,
      resolveDefenseSatLevel(row.planetId),
    )) {
      continue;
    }
    let current = row;
    let attempts = 0;
    while (
      (current.phase === 'outpost' || current.phase === 'fail_wait')
      && isKstDayKeyDue(current.dueDayKey, input.todayKey)
      && attempts < CATCH_UP_ATTEMPT_CAP
    ) {
      if (input.fiscal && !input.fiscal.onBeforeHqRoll(current.planetId, current.travelDays)) {
        break;
      }
      const attemptDayKey = current.dueDayKey ?? input.todayKey;
      const resolved = resolveHqAttempt(
        current,
        attemptDayKey,
        input.resolveGauges(current.planetId),
        input.policy,
      );
      current = resolved.next;
      events.push(resolved.event);
      if (resolved.event.kind === 'hq_success') {
        ready = pushHandoffReadyAt(ready, nowMs, handoffSec);
      }
      attempts += 1;
    }
    next = { ...next, [row.planetId]: current };
  }
  const dispatched = dispatchReadyColonizers({
    records: next,
    fleetReadyAtMs: ready,
    nowMs,
    todayKey: input.todayKey,
    cap,
    outpostArriveSec,
    pickSeed: input.todayKey,
    requiredDefenseSatLevel: input.policy.requireDefenseSatLevel,
    resolveDefenseSatLevel,
    fiscal: input.fiscal,
  });
  events.push(...dispatched.events);
  return {
    records: dispatched.records,
    events,
    fleetReadyAtMs: dispatched.fleetReadyAtMs,
  };
}
