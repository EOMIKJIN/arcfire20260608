import { STELLA_LIFE_DRIVE_IDS, type StellaLifeDriveId, type StellaLifeSnapshot } from './stellaLifeTypes';

export const STELLA_LIFE_MAX_BYTES = 3072;
export const STELLA_LIFE_DIGEST_MAX = 14;
export const STELLA_LIFE_ANCHORS_MAX = 6;
export const STELLA_LIFE_EMA_ALPHA = 0.15;
export const STELLA_LIFE_BACKFILL_MAX_DAYS = 3;

const DRIVE_SET: ReadonlySet<string> = new Set(STELLA_LIFE_DRIVE_IDS);

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function asDrive(raw: string): StellaLifeDriveId {
  return DRIVE_SET.has(raw) ? (raw as StellaLifeDriveId) : 'duty';
}

export function emptyStellaLifeCognition(): StellaLifeSnapshot['cognition'] {
  return {
    recall: 50,
    askDepth: 50,
    grounding: 50,
    casualFirst: 50,
    lastIngestDay: '',
    ev: [],
  };
}

export function emptyStellaLifeSnapshot(): StellaLifeSnapshot {
  return {
    digests: [],
    traits: { duty: 50, warmth: 50, curiosity: 50, steadiness: 50 },
    anchors: [],
    narrative: '',
    sharedDays: 0,
    goalHistory: [],
    lastConsolidatedDayKey: '',
    lastPlayerDay: '',
    lastAskDay: '',
    sessionMoodDelta: 0,
    withPlayerToday: false,
    todayKey: '',
    cognition: emptyStellaLifeCognition(),
    cognitionSession: { h5: 0, topic: 0, casual: 0, dump: 0, corr: 0 },
  };
}

export function parseStellaLifeSnapshot(raw: unknown): StellaLifeSnapshot {
  const empty = emptyStellaLifeSnapshot();
  if (!raw || typeof raw !== 'object') return empty;
  const o = raw as Record<string, unknown>;
  const digests: StellaLifeSnapshot['digests'] = [];
  if (Array.isArray(o.digests)) {
    for (let i = 0; i < o.digests.length && digests.length < STELLA_LIFE_DIGEST_MAX; i += 1) {
      const row = o.digests[i];
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const d = typeof r.d === 'string' ? r.d.trim() : '';
      if (!d) continue;
      const done = Array.isArray(r.done)
        ? r.done.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 24)).slice(0, 2)
        : [];
      digests.push({
        d,
        mood: clamp100(typeof r.mood === 'number' ? r.mood : 50),
        driveId: asDrive(typeof r.driveId === 'string' ? r.driveId : 'duty'),
        goalId: typeof r.goalId === 'string' ? r.goalId.trim().slice(0, 24) : '',
        done,
        withPlayer: r.withPlayer === 1 ? 1 : 0,
      });
    }
  }
  const traitsRaw = o.traits && typeof o.traits === 'object' ? (o.traits as Record<string, unknown>) : {};
  const cogRaw = o.cognition && typeof o.cognition === 'object' ? (o.cognition as Record<string, unknown>) : {};
  const ev: StellaLifeSnapshot['cognition']['ev'] = [];
  if (Array.isArray(cogRaw.ev)) {
    for (let i = 0; i < cogRaw.ev.length && ev.length < 8; i += 1) {
      const row = cogRaw.ev[i];
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const d = typeof r.d === 'string' ? r.d.trim() : '';
      if (!d) continue;
      ev.push({
        d,
        h5: clamp100(typeof r.h5 === 'number' ? r.h5 : 0),
        topic: clamp100(typeof r.topic === 'number' ? r.topic : 0),
        casual: clamp100(typeof r.casual === 'number' ? r.casual : 0),
        dump: clamp100(typeof r.dump === 'number' ? r.dump : 0),
        corr: clamp100(typeof r.corr === 'number' ? r.corr : 0),
      });
    }
  }
  const sess = o.cognitionSession && typeof o.cognitionSession === 'object'
    ? (o.cognitionSession as Record<string, unknown>)
    : {};
  const anchors = Array.isArray(o.anchors)
    ? o.anchors.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 40)).slice(0, STELLA_LIFE_ANCHORS_MAX)
    : [];
  const parsed: StellaLifeSnapshot = {
    digests,
    traits: {
      duty: clamp100(typeof traitsRaw.duty === 'number' ? traitsRaw.duty : 50),
      warmth: clamp100(typeof traitsRaw.warmth === 'number' ? traitsRaw.warmth : 50),
      curiosity: clamp100(typeof traitsRaw.curiosity === 'number' ? traitsRaw.curiosity : 50),
      steadiness: clamp100(typeof traitsRaw.steadiness === 'number' ? traitsRaw.steadiness : 50),
    },
    anchors,
    narrative: typeof o.narrative === 'string' ? o.narrative.trim().slice(0, 240) : '',
    sharedDays: clamp100(typeof o.sharedDays === 'number' ? o.sharedDays : 0),
    goalHistory: Array.isArray(o.goalHistory)
      ? o.goalHistory.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 24)).slice(0, 4)
      : [],
    lastConsolidatedDayKey: typeof o.lastConsolidatedDayKey === 'string' ? o.lastConsolidatedDayKey.trim() : '',
    lastPlayerDay: typeof o.lastPlayerDay === 'string' ? o.lastPlayerDay.trim() : '',
    lastAskDay: typeof o.lastAskDay === 'string' ? o.lastAskDay.trim() : '',
    sessionMoodDelta: Math.max(-10, Math.min(10, Math.round(typeof o.sessionMoodDelta === 'number' ? o.sessionMoodDelta : 0))),
    withPlayerToday: o.withPlayerToday === true,
    todayKey: typeof o.todayKey === 'string' ? o.todayKey.trim() : '',
    cognition: {
      recall: clamp100(typeof cogRaw.recall === 'number' ? cogRaw.recall : 50),
      askDepth: clamp100(typeof cogRaw.askDepth === 'number' ? cogRaw.askDepth : 50),
      grounding: clamp100(typeof cogRaw.grounding === 'number' ? cogRaw.grounding : 50),
      casualFirst: clamp100(typeof cogRaw.casualFirst === 'number' ? cogRaw.casualFirst : 50),
      lastIngestDay: typeof cogRaw.lastIngestDay === 'string' ? cogRaw.lastIngestDay.trim() : '',
      ev,
    },
    cognitionSession: {
      h5: clamp100(typeof sess.h5 === 'number' ? sess.h5 : 0),
      topic: clamp100(typeof sess.topic === 'number' ? sess.topic : 0),
      casual: clamp100(typeof sess.casual === 'number' ? sess.casual : 0),
      dump: clamp100(typeof sess.dump === 'number' ? sess.dump : 0),
      corr: clamp100(typeof sess.corr === 'number' ? sess.corr : 0),
    },
  };
  return clampStellaLifeSnapshotToMaxBytes(parsed);
}

function utf8ByteLength(text: string): number {
  try {
    return new TextEncoder().encode(text).length;
  } catch {
    let n = 0;
    for (let i = 0; i < text.length; i += 1) {
      const c = text.charCodeAt(i);
      if (c <= 0x7f) n += 1;
      else if (c <= 0x7ff) n += 2;
      else if (c >= 0xd800 && c <= 0xdbff) {
        n += 4;
        i += 1;
      } else n += 3;
    }
    return n;
  }
}

export function stellaLifeSnapshotBytes(life: StellaLifeSnapshot): number {
  return utf8ByteLength(JSON.stringify(life));
}

/** persist 상한 — anchors → digests → narrative → ev 순으로만 줄인다. 틱 경로 금지. */
export function clampStellaLifeSnapshotToMaxBytes(life: StellaLifeSnapshot): StellaLifeSnapshot {
  if (stellaLifeSnapshotBytes(life) <= STELLA_LIFE_MAX_BYTES) return life;
  const next: StellaLifeSnapshot = {
    ...life,
    digests: life.digests.slice(),
    anchors: life.anchors.slice(),
    traits: { ...life.traits },
    goalHistory: life.goalHistory.slice(),
    cognition: { ...life.cognition, ev: life.cognition.ev.slice() },
    cognitionSession: { ...life.cognitionSession },
  };
  let guard = 0;
  while (stellaLifeSnapshotBytes(next) > STELLA_LIFE_MAX_BYTES && guard < 48) {
    guard += 1;
    if (next.anchors.length > 0) {
      next.anchors = next.anchors.slice(0, next.anchors.length - 1);
      continue;
    }
    if (next.digests.length > 1) {
      next.digests = next.digests.slice(1);
      continue;
    }
    if (next.narrative.length > 0) {
      next.narrative = next.narrative.slice(0, Math.max(0, next.narrative.length - 24));
      continue;
    }
    if (next.cognition.ev.length > 0) {
      next.cognition = { ...next.cognition, ev: next.cognition.ev.slice(1) };
      continue;
    }
    if (next.digests.length === 1) {
      next.digests = [];
      continue;
    }
    break;
  }
  return next;
}

export function isStellaLifeSnapshotEmpty(life: StellaLifeSnapshot): boolean {
  return (
    life.digests.length === 0
    && life.anchors.length === 0
    && !life.narrative
    && life.sharedDays === 0
    && !life.lastConsolidatedDayKey
    && !life.lastPlayerDay
    && !life.lastAskDay
    && !life.withPlayerToday
    && life.cognition.ev.length === 0
    && life.cognition.lastIngestDay === ''
  );
}
