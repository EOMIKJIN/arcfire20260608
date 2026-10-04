import fs from 'node:fs';
import path from 'node:path';
import type { ActionKind } from './types';

export type SessionKind = 'human' | 'qa' | 'profiler';

/** 대표님 실기에서 온 시드. 없으면 페르소나 하드코드 폴백. */
export type SessionTraceV0 = {
  sessionId: string;
  startedAt?: string;
  source: 'mem_profile' | 'manual';
  sessionKind?: SessionKind;
  capturedFrom?: string;
  capturedAt?: string;
  beats: Array<{ tSec: number; verb: string; detail?: string }>;
};

export type HumanSeedV0 = {
  version: 1;
  player: 'owner';
  updatedAt: string;
  source: 'mem_profile' | 'manual';
  capturedFrom?: string;
  capturedAt?: string;
  traces: SessionTraceV0[];
  orderTop?: string[];
};

const VERB_TO_KIND: Record<string, ActionKind> = {
  land: 'travel',
  depart: 'travel',
  travel: 'travel',
  combat: 'combat',
  quest: 'quest',
  scan: 'quest',
  mine: 'quest',
  trade: 'trade',
  talk: 'quest',
};

export function verbToActionKind(verb: string): ActionKind | undefined {
  return VERB_TO_KIND[verb];
}

let cached: HumanSeedV0 | null | undefined;

export function resetHumanSeedForTest(): void {
  cached = undefined;
  cachedMtimeMs = 0;
}

export function humanSeedPath(dir: string): string {
  return path.join(dir, 'human-seed-v0.json');
}

export function isHumanSeed(raw: unknown): raw is HumanSeedV0 {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as HumanSeedV0;
  return o.version === 1 && Array.isArray(o.traces);
}

const PROFILER_SPAN_SEC = 3 * 3600;

function kindFromBeats(beats: SessionTraceV0['beats']): SessionKind {
  if (beats.length < 2) return 'human';
  const span = beats[beats.length - 1].tSec - beats[0].tSec;
  if (span > PROFILER_SPAN_SEC) return 'profiler';
  return 'human';
}

function hydrateSessionKinds(seed: HumanSeedV0): HumanSeedV0 {
  let changed = false;
  const traces = seed.traces.map((t) => {
    if (t.sessionKind) return t;
    changed = true;
    return { ...t, sessionKind: kindFromBeats(t.beats) };
  });
  return changed ? { ...seed, traces } : seed;
}

export function loadHumanSeed(dir: string): HumanSeedV0 | null {
  if (cached !== undefined) return cached;
  const p = humanSeedPath(dir);
  if (!fs.existsSync(p)) {
    cached = null;
    return null;
  }
  try {
    const raw: unknown = JSON.parse(fs.readFileSync(p, 'utf8'));
    cached = isHumanSeed(raw) && raw.traces.length > 0 ? hydrateSessionKinds(raw) : null;
    cachedMtimeMs = mtimeOf(p);
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export function isBlendableSessionKind(kind: SessionKind | undefined): boolean {
  return kind !== 'qa' && kind !== 'profiler';
}

export function tracesForBlend(seed: HumanSeedV0): SessionTraceV0[] {
  const out: SessionTraceV0[] = [];
  for (let i = 0; i < seed.traces.length; i += 1) {
    const t = seed.traces[i];
    if (isBlendableSessionKind(t.sessionKind)) out.push(t);
  }
  return out;
}

/** 관측된 ActionKind 안에서만 기준합을 사람 비율로 나눔. 비관측 kind는 기준값 유지. */
export function blendPersonaWeights(
  base: Record<ActionKind, number>,
  seed: HumanSeedV0,
): Record<ActionKind, number> {
  const counts: Partial<Record<ActionKind, number>> = {};
  let n = 0;
  const traces = tracesForBlend(seed);
  for (let i = 0; i < traces.length; i += 1) {
    const beats = traces[i].beats;
    for (let j = 0; j < beats.length; j += 1) {
      const kind = VERB_TO_KIND[beats[j].verb];
      if (!kind) continue;
      counts[kind] = (counts[kind] ?? 0) + 1;
      n += 1;
    }
  }
  if (n < 3) return { ...base };
  const keys = Object.keys(base) as ActionKind[];
  const observed: ActionKind[] = [];
  for (let i = 0; i < keys.length; i += 1) {
    if ((counts[keys[i]] ?? 0) > 0) observed.push(keys[i]);
  }
  if (observed.length === 0) return { ...base };
  let baseSumObs = 0;
  for (let i = 0; i < observed.length; i += 1) {
    baseSumObs += base[observed[i]] ?? 0;
  }
  const next = { ...base };
  for (let i = 0; i < observed.length; i += 1) {
    const k = observed[i];
    next[k] = baseSumObs * ((counts[k] ?? 0) / n);
  }
  return next;
}

export function formatHumanSeedLine(seed: HumanSeedV0 | null): string {
  if (!seed) return '대표님 시드 없음';
  const human = seed.traces.filter((t) => isBlendableSessionKind(t.sessionKind)).length;
  const skip = seed.traces.length - human;
  const at = (seed.capturedAt ?? seed.updatedAt).slice(0, 10);
  return `대표님 시드 ${at} · 세션 ${human} (제외 ${skip}) · ${seed.capturedFrom ?? seed.source}`;
}

/** 대표님 세션 누적 상한 — 계획 L1 cap 32. */
export const HUMAN_SEED_SESSION_CAP = 32;

function traceTime(t: SessionTraceV0): string {
  return t.capturedAt ?? t.startedAt ?? '';
}

function orderTopOf(traces: readonly SessionTraceV0[], cap = 3): string[] {
  const counts: Record<string, number> = {};
  for (let i = 0; i < traces.length; i += 1) {
    if (!isBlendableSessionKind(traces[i].sessionKind)) continue;
    const b = traces[i].beats;
    for (let j = 0; j < b.length - 1; j += 1) {
      const key = `${b[j].verb}>${b[j + 1].verb}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
  return Object.keys(counts).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)).slice(0, cap);
}

/** sessionId 기준 병합(같은 id는 새 것으로 교체) · 최근 HUMAN_SEED_SESSION_CAP개 유지. */
export function mergeHumanSeed(prev: HumanSeedV0 | null, next: HumanSeedV0): HumanSeedV0 {
  if (!prev) return { ...next, orderTop: orderTopOf(next.traces) };
  const byId = new Map<string, SessionTraceV0>();
  for (let i = 0; i < prev.traces.length; i += 1) byId.set(prev.traces[i].sessionId, prev.traces[i]);
  for (let i = 0; i < next.traces.length; i += 1) byId.set(next.traces[i].sessionId, next.traces[i]);
  const all = Array.from(byId.values()).sort((a, b) => traceTime(a).localeCompare(traceTime(b)));
  const traces = all.length > HUMAN_SEED_SESSION_CAP ? all.slice(all.length - HUMAN_SEED_SESSION_CAP) : all;
  return { ...next, traces, orderTop: orderTopOf(traces) };
}

export function readHumanSeedFile(dir: string): HumanSeedV0 | null {
  return readSeedFile(humanSeedPath(dir));
}

function readSeedFile(dest: string): HumanSeedV0 | null {
  try {
    if (!fs.existsSync(dest)) return null;
    const raw: unknown = JSON.parse(fs.readFileSync(dest, 'utf8'));
    return isHumanSeed(raw) ? hydrateSessionKinds(raw) : null;
  } catch {
    return null;
  }
}

export function writeHumanSeed(dir: string, seed: HumanSeedV0): string {
  fs.mkdirSync(dir, { recursive: true });
  const dest = humanSeedPath(dir);
  const merged = mergeHumanSeed(readSeedFile(dest), seed);
  const tmp = `${dest}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  try {
    fs.renameSync(tmp, dest);
  } catch {
    fs.copyFileSync(tmp, dest);
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
  cached = merged;
  cachedMtimeMs = mtimeOf(dest);
  return dest;
}

let cachedMtimeMs = 0;

function mtimeOf(file: string): number {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

/** 캠페인 시작 시 호출 — 다른 프로세스(수집 데몬)가 시드를 갱신했으면 재로드(T5). */
export function reloadHumanSeedIfChanged(dir: string): boolean {
  const m = mtimeOf(humanSeedPath(dir));
  if (cached !== undefined && m === cachedMtimeMs) return false;
  cached = undefined;
  loadHumanSeed(dir);
  cachedMtimeMs = m;
  return true;
}
