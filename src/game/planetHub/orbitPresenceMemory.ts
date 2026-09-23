// ============================================================
// 세축 기억 — 순수 스키마·LRU·씬 변이·digest. RN/스토어 금지.
// 정본: docs/세축_반응_잔상_세계변화_설계.md v1.1 Phase 1
// ============================================================

export const ORBIT_PRESENCE_MEMORY_SCHEMA_VERSION = 1;
export const ORBIT_PRESENCE_CAPTAINS_MAX = 64;
export const ORBIT_PRESENCE_EVENTS_MAX = 4;
export const ORBIT_PRESENCE_VISITS_MAX = 24;
export const ORBIT_PRESENCE_ROSTER_MAX = 8;

export type OrbitCommOutcome =
  | 'accept'
  | 'refuse_hostile'
  | 'refuse_unidentified'
  | 'refuse_talk_disabled';

export type OrbitCommEvent = {
  atMs: number;
  planetId: string;
  outcome: OrbitCommOutcome;
  sceneId: string;
};

export type CaptainPresenceMemory = {
  captainId: string;
  lastPlanetId: string;
  lastSeenAtMs: number;
  lastOutcome: OrbitCommOutcome | 'seen_orbit';
  commCount: number;
  refuseCount: number;
  events: OrbitCommEvent[];
  lastPersonalOfferDayKey?: string;
  declineUntilDayKey?: string;
  personalThanksPending?: boolean;
};

export type PlanetVisitSnapshot = {
  planetId: string;
  visitedAtMs: number;
  holdSig: string;
  captainIds: string[];
  boardHeadId: string;
  boardHeadTag?: string;
};

export type OrbitPresenceMemoryPayload = {
  schemaVersion: number;
  updatedAtMs: number;
  captains: CaptainPresenceMemory[];
  visits: PlanetVisitSnapshot[];
  lastOrbitCommWriteId: string;
};

export type WorldChangeItem =
  | { kind: 'hold' }
  | { kind: 'roster'; direction: 'gone' | 'back'; captainId: string }
  | { kind: 'board' };

const WORLD_CHANGE_BOARD_TAGS = new Set(['ops', 'diplomacy', 'arccore']);

const OUTCOMES: ReadonlySet<string> = new Set([
  'accept',
  'refuse_hostile',
  'refuse_unidentified',
  'refuse_talk_disabled',
]);

function asTrimmed(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

function asMs(raw: unknown, fallback: number): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function asCount(raw: unknown): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function emptyOrbitPresenceMemoryPayload(nowMs = 0): OrbitPresenceMemoryPayload {
  return {
    schemaVersion: ORBIT_PRESENCE_MEMORY_SCHEMA_VERSION,
    updatedAtMs: nowMs,
    captains: [],
    visits: [],
    lastOrbitCommWriteId: '',
  };
}

function normalizeEvent(raw: unknown, fallbackMs: number): OrbitCommEvent | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const planetId = asTrimmed(row.planetId);
  const sceneId = asTrimmed(row.sceneId);
  const outcome = asTrimmed(row.outcome);
  if (!planetId || !sceneId || !OUTCOMES.has(outcome)) return null;
  return {
    atMs: asMs(row.atMs, fallbackMs),
    planetId,
    outcome: outcome as OrbitCommOutcome,
    sceneId,
  };
}

function normalizeCaptain(raw: unknown, fallbackMs: number): CaptainPresenceMemory | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const captainId = asTrimmed(row.captainId);
  if (!captainId) return null;
  const lastOutcomeRaw = asTrimmed(row.lastOutcome);
  const lastOutcome =
    lastOutcomeRaw === 'seen_orbit' || OUTCOMES.has(lastOutcomeRaw)
      ? (lastOutcomeRaw as CaptainPresenceMemory['lastOutcome'])
      : 'seen_orbit';
  const eventsIn = Array.isArray(row.events) ? row.events : [];
  const events: OrbitCommEvent[] = [];
  for (let i = 0; i < eventsIn.length && events.length < ORBIT_PRESENCE_EVENTS_MAX; i += 1) {
    const ev = normalizeEvent(eventsIn[i], fallbackMs);
    if (ev) events.push(ev);
  }
  const lastPersonalOfferDayKey = asTrimmed(row.lastPersonalOfferDayKey);
  const declineUntilDayKey = asTrimmed(row.declineUntilDayKey);
  return {
    captainId,
    lastPlanetId: asTrimmed(row.lastPlanetId),
    lastSeenAtMs: asMs(row.lastSeenAtMs, fallbackMs),
    lastOutcome,
    commCount: asCount(row.commCount),
    refuseCount: asCount(row.refuseCount),
    events,
    lastPersonalOfferDayKey: lastPersonalOfferDayKey || undefined,
    declineUntilDayKey: declineUntilDayKey || undefined,
    personalThanksPending: row.personalThanksPending === true ? true : undefined,
  };
}

function normalizeVisit(raw: unknown, fallbackMs: number): PlanetVisitSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const planetId = asTrimmed(row.planetId);
  if (!planetId) return null;
  const idsIn = Array.isArray(row.captainIds) ? row.captainIds : [];
  const captainIds: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < idsIn.length && captainIds.length < ORBIT_PRESENCE_ROSTER_MAX; i += 1) {
    const id = asTrimmed(idsIn[i]);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    captainIds.push(id);
  }
  const tag = asTrimmed(row.boardHeadTag);
  return {
    planetId,
    visitedAtMs: asMs(row.visitedAtMs, fallbackMs),
    holdSig: asTrimmed(row.holdSig),
    captainIds,
    boardHeadId: asTrimmed(row.boardHeadId),
    boardHeadTag: tag || undefined,
  };
}

export function normalizeOrbitPresenceMemoryPayload(raw: unknown): OrbitPresenceMemoryPayload {
  const nowMs = Date.now();
  if (!raw || typeof raw !== 'object') return emptyOrbitPresenceMemoryPayload(nowMs);
  const row = raw as Record<string, unknown>;
  const captainsIn = Array.isArray(row.captains) ? row.captains : [];
  const captains: CaptainPresenceMemory[] = [];
  const seenCaptains = new Set<string>();
  for (let i = 0; i < captainsIn.length && captains.length < ORBIT_PRESENCE_CAPTAINS_MAX; i += 1) {
    const cap = normalizeCaptain(captainsIn[i], nowMs);
    if (!cap || seenCaptains.has(cap.captainId)) continue;
    seenCaptains.add(cap.captainId);
    captains.push(cap);
  }
  const visitsIn = Array.isArray(row.visits) ? row.visits : [];
  const visits: PlanetVisitSnapshot[] = [];
  const seenPlanets = new Set<string>();
  for (let i = 0; i < visitsIn.length && visits.length < ORBIT_PRESENCE_VISITS_MAX; i += 1) {
    const visit = normalizeVisit(visitsIn[i], nowMs);
    if (!visit || seenPlanets.has(visit.planetId)) continue;
    seenPlanets.add(visit.planetId);
    visits.push(visit);
  }
  return {
    schemaVersion: ORBIT_PRESENCE_MEMORY_SCHEMA_VERSION,
    updatedAtMs: asMs(row.updatedAtMs, nowMs),
    captains,
    visits,
    lastOrbitCommWriteId: asTrimmed(row.lastOrbitCommWriteId),
  };
}

export function buildPlanetHoldSig(input: {
  occupierClanId?: string | null;
  deedOwnerClanId?: string | null;
  kind?: string | null;
  neutralizedAt?: number | null;
}): string {
  const occupier = asTrimmed(input.occupierClanId);
  const deed = asTrimmed(input.deedOwnerClanId);
  const kind = asTrimmed(input.kind);
  const neu = input.neutralizedAt == null ? 0 : asMs(input.neutralizedAt, 0);
  return `${occupier}|${deed}|${kind}|${neu}`;
}

export function makeOrbitCommWriteId(nowMs = Date.now()): string {
  return `${nowMs}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getCaptainPresenceMemoryFromPayload(
  payload: OrbitPresenceMemoryPayload,
  captainId: string,
): CaptainPresenceMemory | undefined {
  const id = asTrimmed(captainId);
  if (!id) return undefined;
  for (let i = 0; i < payload.captains.length; i += 1) {
    const row = payload.captains[i];
    if (row && row.captainId === id) return row;
  }
  return undefined;
}

function evictOldestCaptain(payload: OrbitPresenceMemoryPayload): void {
  if (payload.captains.length < ORBIT_PRESENCE_CAPTAINS_MAX) return;
  let oldest = 0;
  let oldestMs = payload.captains[0]?.lastSeenAtMs ?? 0;
  for (let i = 1; i < payload.captains.length; i += 1) {
    const ms = payload.captains[i]?.lastSeenAtMs ?? 0;
    if (ms < oldestMs) {
      oldest = i;
      oldestMs = ms;
    }
  }
  payload.captains.splice(oldest, 1);
}

function evictOldestVisit(payload: OrbitPresenceMemoryPayload): void {
  if (payload.visits.length <= ORBIT_PRESENCE_VISITS_MAX) return;
  let oldest = 0;
  let oldestMs = payload.visits[0]?.visitedAtMs ?? 0;
  for (let i = 1; i < payload.visits.length; i += 1) {
    const ms = payload.visits[i]?.visitedAtMs ?? 0;
    if (ms < oldestMs) {
      oldest = i;
      oldestMs = ms;
    }
  }
  payload.visits.splice(oldest, 1);
}

export function recordOrbitCommOnPayload(
  payload: OrbitPresenceMemoryPayload,
  input: {
    captainId: string;
    planetId: string;
    outcome: OrbitCommOutcome;
    sceneId: string;
    atMs: number;
    writeId: string;
  },
): boolean {
  const captainId = asTrimmed(input.captainId);
  const planetId = asTrimmed(input.planetId);
  const sceneId = asTrimmed(input.sceneId);
  const writeId = asTrimmed(input.writeId);
  if (!captainId || !planetId || !sceneId || !writeId) return false;
  if (payload.lastOrbitCommWriteId === writeId) return false;

  let row = getCaptainPresenceMemoryFromPayload(payload, captainId);
  if (!row) {
    evictOldestCaptain(payload);
    row = {
      captainId,
      lastPlanetId: planetId,
      lastSeenAtMs: input.atMs,
      lastOutcome: input.outcome,
      commCount: 0,
      refuseCount: 0,
      events: [],
    };
    payload.captains.push(row);
  }

  row.lastPlanetId = planetId;
  row.lastSeenAtMs = input.atMs;
  row.lastOutcome = input.outcome;
  if (input.outcome === 'accept') row.commCount += 1;
  else row.refuseCount += 1;

  row.events.unshift({
    atMs: input.atMs,
    planetId,
    outcome: input.outcome,
    sceneId,
  });
  if (row.events.length > ORBIT_PRESENCE_EVENTS_MAX) {
    row.events.length = ORBIT_PRESENCE_EVENTS_MAX;
  }

  payload.lastOrbitCommWriteId = writeId;
  payload.updatedAtMs = input.atMs;
  return true;
}

export function touchCaptainSeenOnPayload(
  payload: OrbitPresenceMemoryPayload,
  input: { captainId: string; planetId: string; atMs: number },
): boolean {
  const captainId = asTrimmed(input.captainId);
  const planetId = asTrimmed(input.planetId);
  if (!captainId || !planetId) return false;
  let row = getCaptainPresenceMemoryFromPayload(payload, captainId);
  if (!row) {
    evictOldestCaptain(payload);
    row = {
      captainId,
      lastPlanetId: planetId,
      lastSeenAtMs: input.atMs,
      lastOutcome: 'seen_orbit',
      commCount: 0,
      refuseCount: 0,
      events: [],
    };
    payload.captains.push(row);
    payload.updatedAtMs = input.atMs;
    return true;
  }
  row.lastPlanetId = planetId;
  row.lastSeenAtMs = input.atMs;
  payload.updatedAtMs = input.atMs;
  return true;
}

export function recordPlanetVisitSnapshotOnPayload(
  payload: OrbitPresenceMemoryPayload,
  snap: PlanetVisitSnapshot,
): void {
  const planetId = asTrimmed(snap.planetId);
  if (!planetId) return;
  const next: PlanetVisitSnapshot = {
    planetId,
    visitedAtMs: snap.visitedAtMs,
    holdSig: asTrimmed(snap.holdSig),
    captainIds: snap.captainIds.slice(0, ORBIT_PRESENCE_ROSTER_MAX),
    boardHeadId: asTrimmed(snap.boardHeadId),
    boardHeadTag: asTrimmed(snap.boardHeadTag) || undefined,
  };
  for (let i = 0; i < payload.visits.length; i += 1) {
    if (payload.visits[i]?.planetId === planetId) {
      payload.visits[i] = next;
      payload.updatedAtMs = snap.visitedAtMs;
      return;
    }
  }
  payload.visits.push(next);
  evictOldestVisit(payload);
  payload.updatedAtMs = snap.visitedAtMs;
}

export function getPlanetVisitSnapshotFromPayload(
  payload: OrbitPresenceMemoryPayload,
  planetId: string,
): PlanetVisitSnapshot | undefined {
  const id = asTrimmed(planetId);
  if (!id) return undefined;
  for (let i = 0; i < payload.visits.length; i += 1) {
    const row = payload.visits[i];
    if (row && row.planetId === id) return row;
  }
  return undefined;
}

export function resolveOrbitCommSceneVariant(
  baseSceneId: string,
  memory: CaptainPresenceMemory | undefined,
  hasScene: (sceneId: string) => boolean,
  currentPlanetId?: string,
): { sceneId: string; visitCount: number } {
  const base = asTrimmed(baseSceneId);
  const visitCount = memory?.commCount ?? 0;
  if (!base || visitCount < 1) return { sceneId: base, visitCount };

  const lastPlanetId = asTrimmed(memory?.lastPlanetId);
  const nowPlanet = asTrimmed(currentPlanetId);
  const fromId = `${base}__revisit_from`;
  if (lastPlanetId && nowPlanet && lastPlanetId !== nowPlanet && hasScene(fromId)) {
    return { sceneId: fromId, visitCount };
  }
  const revisitId = `${base}__revisit`;
  if (hasScene(revisitId)) return { sceneId: revisitId, visitCount };
  return { sceneId: base, visitCount };
}

export function computeWorldChangeDigest(
  prev: PlanetVisitSnapshot | undefined,
  next: Omit<PlanetVisitSnapshot, 'visitedAtMs'>,
  rememberedCaptainIds: ReadonlySet<string>,
): WorldChangeItem[] {
  if (!prev) return [];
  const items: WorldChangeItem[] = [];
  if (asTrimmed(prev.holdSig) !== asTrimmed(next.holdSig)) {
    items.push({ kind: 'hold' });
  }

  const nextSet = new Set(next.captainIds);
  let roster: WorldChangeItem | undefined;
  for (let i = 0; i < prev.captainIds.length; i += 1) {
    const id = prev.captainIds[i];
    if (!id || !rememberedCaptainIds.has(id) || nextSet.has(id)) continue;
    roster = { kind: 'roster', direction: 'gone', captainId: id };
    break;
  }
  if (!roster) {
    const prevSet = new Set(prev.captainIds);
    for (let i = 0; i < next.captainIds.length; i += 1) {
      const id = next.captainIds[i];
      if (!id || !rememberedCaptainIds.has(id) || prevSet.has(id)) continue;
      roster = { kind: 'roster', direction: 'back', captainId: id };
      break;
    }
  }
  if (roster) items.push(roster);

  if (
    items.length < 2
    && asTrimmed(prev.boardHeadId) !== asTrimmed(next.boardHeadId)
    && WORLD_CHANGE_BOARD_TAGS.has(asTrimmed(next.boardHeadTag))
  ) {
    items.push({ kind: 'board' });
  }
  return items.slice(0, 2);
}

/** hydrate 레이스 — 메모리(방금 기록)가 같은 id에서 이긴다. */
export function mergeOrbitPresenceMemoryPayload(
  disk: OrbitPresenceMemoryPayload,
  memory: OrbitPresenceMemoryPayload,
): OrbitPresenceMemoryPayload {
  const out = emptyOrbitPresenceMemoryPayload(Math.max(disk.updatedAtMs, memory.updatedAtMs));
  const seenCaptains = new Set<string>();
  for (let i = 0; i < memory.captains.length && out.captains.length < ORBIT_PRESENCE_CAPTAINS_MAX; i += 1) {
    const row = memory.captains[i];
    if (!row || seenCaptains.has(row.captainId)) continue;
    seenCaptains.add(row.captainId);
    out.captains.push(row);
  }
  for (let i = 0; i < disk.captains.length && out.captains.length < ORBIT_PRESENCE_CAPTAINS_MAX; i += 1) {
    const row = disk.captains[i];
    if (!row || seenCaptains.has(row.captainId)) continue;
    seenCaptains.add(row.captainId);
    out.captains.push(row);
  }
  const seenPlanets = new Set<string>();
  for (let i = 0; i < memory.visits.length && out.visits.length < ORBIT_PRESENCE_VISITS_MAX; i += 1) {
    const row = memory.visits[i];
    if (!row || seenPlanets.has(row.planetId)) continue;
    seenPlanets.add(row.planetId);
    out.visits.push(row);
  }
  for (let i = 0; i < disk.visits.length && out.visits.length < ORBIT_PRESENCE_VISITS_MAX; i += 1) {
    const row = disk.visits[i];
    if (!row || seenPlanets.has(row.planetId)) continue;
    seenPlanets.add(row.planetId);
    out.visits.push(row);
  }
  out.lastOrbitCommWriteId = memory.lastOrbitCommWriteId || disk.lastOrbitCommWriteId;
  return out;
}

export function parsePlanetHoldSig(holdSig: string): {
  occupierClanId: string;
  deedOwnerClanId: string;
  kind: string;
  neutralizedAt: number;
} {
  const parts = asTrimmed(holdSig).split('|');
  return {
    occupierClanId: asTrimmed(parts[0]),
    deedOwnerClanId: asTrimmed(parts[1]),
    kind: asTrimmed(parts[2]),
    neutralizedAt: asMs(parts[3], 0),
  };
}

export function resolveOrbitCommConnectedBodyKind(
  commCount: number,
  lastPlanetId: string | undefined,
  currentPlanetId: string,
): 'connected' | 'revisit' | 'revisit_from' {
  if (commCount < 1) return 'connected';
  const last = asTrimmed(lastPlanetId);
  const now = asTrimmed(currentPlanetId);
  if (last && now && last !== now) return 'revisit_from';
  return 'revisit';
}

export function patchCaptainPersonalMemoryOnPayload(
  payload: OrbitPresenceMemoryPayload,
  captainId: string,
  patch: {
    lastPersonalOfferDayKey?: string;
    declineUntilDayKey?: string;
    personalThanksPending?: boolean;
  },
  atMs = Date.now(),
): boolean {
  const id = asTrimmed(captainId);
  if (!id) return false;
  let row = getCaptainPresenceMemoryFromPayload(payload, id);
  if (!row) {
    evictOldestCaptain(payload);
    row = {
      captainId: id,
      lastPlanetId: '',
      lastSeenAtMs: atMs,
      lastOutcome: 'seen_orbit',
      commCount: 0,
      refuseCount: 0,
      events: [],
    };
    payload.captains.push(row);
  }
  if (patch.lastPersonalOfferDayKey !== undefined) {
    const key = asTrimmed(patch.lastPersonalOfferDayKey);
    row.lastPersonalOfferDayKey = key || undefined;
  }
  if (patch.declineUntilDayKey !== undefined) {
    const key = asTrimmed(patch.declineUntilDayKey);
    row.declineUntilDayKey = key || undefined;
  }
  if (patch.personalThanksPending !== undefined) {
    row.personalThanksPending = patch.personalThanksPending ? true : undefined;
  }
  row.lastSeenAtMs = atMs;
  payload.updatedAtMs = atMs;
  return true;
}

export function getLastOrbitCommCaptainFromPayload(
  payload: OrbitPresenceMemoryPayload,
): CaptainPresenceMemory | undefined {
  let best: CaptainPresenceMemory | undefined;
  for (let i = 0; i < payload.captains.length; i += 1) {
    const row = payload.captains[i];
    if (!row || row.commCount < 1) continue;
    if (!best || row.lastSeenAtMs > best.lastSeenAtMs) best = row;
  }
  return best;
}

export function rememberedCaptainIdSet(payload: OrbitPresenceMemoryPayload): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < payload.captains.length; i += 1) {
    const id = payload.captains[i]?.captainId;
    if (id) out.add(id);
  }
  return out;
}

export function mapOrbitCommRefuseReason(
  reason: 'hostile' | 'unidentified' | 'talk_disabled',
): Exclude<OrbitCommOutcome, 'accept'> {
  if (reason === 'unidentified') return 'refuse_unidentified';
  if (reason === 'talk_disabled') return 'refuse_talk_disabled';
  return 'refuse_hostile';
}
