import type { SessionKind, SessionTraceV0 } from './humanSeed';

export type MemProfileBeat = {
  tSec: number;
  stage: string;
  event: string;
  detail?: string;
};

export type MemProfileImportMeta = {
  capturedFrom?: string;
  capturedAt?: string;
  defaultKind?: SessionKind;
  /** owner-playlog 등 의도된 실기 — span>3h 여도 profiler로 내리지 않음 */
  forceKind?: SessionKind;
};

const LINE_RE = /\[MEM_PROFILE\]\s+stage=(\S+)\s+event=(\S+)(?:\s+hermes_mb=\S+)?(?:\s+detail=(\S+))?/;
/** 앱 `devPlayVerbLog` — 퀘스트·전투·무역·편입·스킬 (개발 빌드 전용) */
const PLAY_VERB_RE = /\[PLAY_VERB\]\s+verb=(\S+)(?:\s+detail=(\S+))?/;
const PLAY_VERB_STAGE = 'play';
const PLAY_VERBS: Record<string, string> = {
  quest: 'quest',
  combat: 'combat',
  trade: 'trade',
  annex: 'annex',
  skill: 'skill',
  ship: 'ship',
};
const TS_RE = /^(\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/;

const SKIP_DETAIL = /hub_dodge|unmount_debounce|deep_reclaim|post_ingress_settle/;
const HUB_COMBAT_MARK = /ingress_after_hub_combat|after_hub_combat/;
const SESSION_GAP_SEC = 20 * 60;
const PROFILER_SPAN_SEC = 3 * 3600;
const SAME_VERB_DEBOUNCE_SEC = 6;
const TRANSITION_DEDUP_SEC = 1;
const HUB_COMBAT_ATTACH_SEC = 2;
const BEAT_CAP = 48;

function isHubCombatMarker(event: string, detail: string): boolean {
  return HUB_COMBAT_MARK.test(detail) && event !== 'transit_combat_nav';
}

export function verbOf(stage: string, event: string, detail: string): string | null {
  if (stage === PLAY_VERB_STAGE) return PLAY_VERBS[event] ?? null;
  if (SKIP_DETAIL.test(detail)) return null;
  if (isHubCombatMarker(event, detail)) return null;
  if (event === 'transit_hop_start' || detail.includes('departure_preflight')) return 'depart';
  if (event === 'transit_combat_nav') return 'combat';
  if (stage === 'planet_hub' && (event === 'route_focus' || event === 'planet_change' || event === 'ingress_reclaim')) {
    return detail ? 'land' : null;
  }
  if (event === 'system_change' || event === 'transit_hop_start') return 'travel';
  return null;
}

export function parseMemProfileLines(text: string): MemProfileBeat[] {
  const lines = text.split(/\r?\n/);
  const out: MemProfileBeat[] = [];
  let origin = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    let stage: string;
    let event: string;
    let detail: string | undefined;
    if (line.includes('[MEM_PROFILE]')) {
      const m = LINE_RE.exec(line);
      if (!m) continue;
      stage = m[1];
      event = m[2];
      detail = m[3];
    } else if (line.includes('[PLAY_VERB]')) {
      const p = PLAY_VERB_RE.exec(line);
      if (!p) continue;
      stage = PLAY_VERB_STAGE;
      event = p[1];
      detail = p[2];
    } else {
      continue;
    }
    const ts = TS_RE.exec(line);
    let tSec = out.length;
    if (ts) {
      const parts = ts[1].split(/[-:\s]/).map((x) => Number(x));
      const abs = ((parts[0] || 0) * 31 + (parts[1] || 0)) * 86400
        + (parts[2] || 0) * 3600 + (parts[3] || 0) * 60 + (parts[4] || 0);
      if (origin === 0) origin = abs;
      tSec = Math.max(0, abs - origin);
    }
    out.push({ tSec, stage, event, detail });
  }
  return out;
}

function alreadyHasCombatNear(beats: SessionTraceV0['beats'], tSec: number): boolean {
  for (let i = beats.length - 1; i >= 0; i -= 1) {
    if (tSec - beats[i].tSec > HUB_COMBAT_ATTACH_SEC) break;
    if (beats[i].verb === 'combat') return true;
  }
  return false;
}

function attachHubCombat(
  beats: SessionTraceV0['beats'],
  markerT: number,
  detail: string,
): void {
  if (alreadyHasCombatNear(beats, markerT)) return;
  const combat = { tSec: markerT, verb: 'combat', detail };
  for (let i = beats.length - 1; i >= 0; i -= 1) {
    if (markerT - beats[i].tSec > HUB_COMBAT_ATTACH_SEC) break;
    if (beats[i].verb === 'depart') {
      combat.tSec = beats[i].tSec;
      beats.splice(i, 0, combat);
      return;
    }
  }
  for (let i = beats.length - 1; i >= 0; i -= 1) {
    if (beats[i].verb === 'land') {
      combat.tSec = beats[i].tSec;
      beats.splice(i + 1, 0, combat);
      return;
    }
  }
}

function pushBeat(
  beats: SessionTraceV0['beats'],
  tSec: number,
  verb: string,
  detail: string | undefined,
  last: { verb: string; t: number },
): void {
  if (verb === last.verb && tSec - last.t < SAME_VERB_DEBOUNCE_SEC) return;
  if (verb === last.verb && tSec - last.t < TRANSITION_DEDUP_SEC) return;
  beats.push({ tSec, verb, detail });
  last.verb = verb;
  last.t = tSec;
}

function splitByGap(beats: SessionTraceV0['beats'], gapSec = SESSION_GAP_SEC): SessionTraceV0['beats'][] {
  const groups: SessionTraceV0['beats'][] = [];
  let cur: SessionTraceV0['beats'] = [];
  for (let i = 0; i < beats.length; i += 1) {
    const b = beats[i];
    if (cur.length > 0 && b.tSec - cur[cur.length - 1].tSec >= gapSec) {
      groups.push(cur);
      cur = [];
    }
    cur.push(b);
  }
  if (cur.length > 0) groups.push(cur);
  return groups;
}

export function classifySessionKind(
  beats: SessionTraceV0['beats'],
  defaultKind: SessionKind = 'human',
): SessionKind {
  if (defaultKind !== 'human') return defaultKind;
  if (beats.length < 2) return 'human';
  const span = beats[beats.length - 1].tSec - beats[0].tSec;
  if (span > PROFILER_SPAN_SEC) return 'profiler';
  return 'human';
}

export function memProfileToTraces(
  text: string,
  runId = 'owner-mem',
  meta?: MemProfileImportMeta,
): SessionTraceV0[] {
  const rows = parseMemProfileLines(text);
  const beats: SessionTraceV0['beats'] = [];
  const last = { verb: '', t: -8 };
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const detail = r.detail ?? '';
    if (isHubCombatMarker(r.event, detail)) {
      attachHubCombat(beats, r.tSec, detail);
      continue;
    }
    const verb = verbOf(r.stage, r.event, detail);
    if (!verb) continue;
    pushBeat(beats, r.tSec, verb, r.detail, last);
  }
  if (beats.length < 2) return [];

  const capturedAt = meta?.capturedAt;
  const capturedFrom = meta?.capturedFrom;
  const defaultKind = meta?.defaultKind
    ?? (runId.includes('qa') || (capturedFrom ?? '').toLowerCase().includes('qa') ? 'qa' : 'human');

  const sessions: SessionTraceV0[] = [];
  const groups = splitByGap(beats);
  for (let g = 0; g < groups.length; g += 1) {
    const group = groups[g];
    for (let i = 0; i < group.length; i += BEAT_CAP) {
      const slice = group.slice(i, i + BEAT_CAP);
      if (slice.length < 2) continue;
      sessions.push({
        sessionId: `${runId}-${sessions.length + 1}`,
        source: 'mem_profile',
        sessionKind: meta?.forceKind ?? classifySessionKind(slice, defaultKind),
        capturedFrom,
        capturedAt,
        beats: slice,
      });
    }
  }
  return sessions;
}

export function orderTopFromTraces(traces: SessionTraceV0[], cap = 3): string[] {
  const counts: Record<string, number> = {};
  for (let i = 0; i < traces.length; i += 1) {
    const b = traces[i].beats;
    for (let j = 0; j < b.length - 1; j += 1) {
      const key = `${b[j].verb}>${b[j + 1].verb}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.keys(counts).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)).slice(0, cap);
}
