/**
 * 대표님 실기 세션 1건의 차이. 학습은 미소비 델타가 있을 때만 연다.
 * 틱·앱 세이브·CSV와 무관. 파일 1건.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  isBlendableSessionKind,
  readHumanSeedFile,
  verbToActionKind,
  type SessionTraceV0,
} from './humanSeed';
import type { ActionKind } from './types';

export type HumanDeltaFile = {
  version: 1;
  sessionId: string;
  capturedAt: string;
  /** 이번 세션에만 있는 동사 쌍. 상한 12. */
  newPairs: string[];
  coveredKinds: ActionKind[];
  /** 트윈 행동으로 못 바꾸는 동사. 기능 추가는 하지 않고 이름만 남긴다. */
  missingVerbs: string[];
  combatMethod: 'absent' | 'present';
  consumed: boolean;
  consumedAt?: string;
};

const PAIR_CAP = 12;
const COMBAT_METHOD_RE = /(?:^|[;\s])(range|weapon|approach)=/;

function atomicWrite(file: string, body: string): void {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, body, 'utf8');
  try {
    fs.renameSync(tmp, file);
  } catch {
    fs.copyFileSync(tmp, file);
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

export function humanDeltaPath(dir: string): string {
  return path.join(dir, 'human-delta.json');
}

function beatSig(trace: SessionTraceV0): string {
  let s = '';
  for (let i = 0; i < trace.beats.length; i += 1) {
    if (i > 0) s += '|';
    s += trace.beats[i].verb;
  }
  return s;
}

function addPairs(trace: SessionTraceV0, into: Set<string>): void {
  const b = trace.beats;
  for (let i = 0; i < b.length - 1; i += 1) {
    into.add(`${b[i].verb}>${b[i + 1].verb}`);
  }
}

function hasCombatMethod(trace: SessionTraceV0): boolean {
  const b = trace.beats;
  for (let i = 0; i < b.length; i += 1) {
    if (COMBAT_METHOD_RE.test(b[i].detail ?? '')) return true;
  }
  return false;
}

/** 직전 시드에 없거나 비트 서명이 바뀐 사람 세션만 델타. 동일 재수입은 null. */
export function planHumanDelta(dir: string, incoming: readonly SessionTraceV0[]): HumanDeltaFile | null {
  const prev = readHumanSeedFile(dir);
  const prevById = new Map<string, string>();
  const prevPairs = new Set<string>();
  const prevTraces = prev?.traces ?? [];
  for (let i = 0; i < prevTraces.length; i += 1) {
    const t = prevTraces[i];
    if (!isBlendableSessionKind(t.sessionKind)) continue;
    prevById.set(t.sessionId, beatSig(t));
  }

  const fresh: SessionTraceV0[] = [];
  for (let i = 0; i < incoming.length; i += 1) {
    const t = incoming[i];
    if (!isBlendableSessionKind(t.sessionKind)) continue;
    const sig = beatSig(t);
    if (prevById.get(t.sessionId) === sig) continue;
    fresh.push(t);
  }
  if (fresh.length === 0) return null;

  const replaced = new Set<string>();
  for (let i = 0; i < fresh.length; i += 1) replaced.add(fresh[i].sessionId);
  prevPairs.clear();
  for (let i = 0; i < prevTraces.length; i += 1) {
    const t = prevTraces[i];
    if (!isBlendableSessionKind(t.sessionKind) || replaced.has(t.sessionId)) continue;
    addPairs(t, prevPairs);
  }

  const pairCounts: Record<string, number> = {};
  const missingSet = new Set<string>();
  const kindSet = new Set<ActionKind>();
  let combat: 'absent' | 'present' = 'absent';
  let sessionId = fresh[0].sessionId;
  let capturedAt = fresh[0].capturedAt ?? new Date().toISOString();
  for (let i = 0; i < fresh.length; i += 1) {
    const t = fresh[i];
    const at = t.capturedAt ?? '';
    if (at >= capturedAt) {
      capturedAt = at || capturedAt;
      sessionId = t.sessionId;
    }
    if (hasCombatMethod(t)) combat = 'present';
    const b = t.beats;
    for (let j = 0; j < b.length; j += 1) {
      const kind = verbToActionKind(b[j].verb);
      if (kind) kindSet.add(kind);
      else missingSet.add(b[j].verb);
      if (j === 0) continue;
      const pair = `${b[j - 1].verb}>${b[j].verb}`;
      if (!prevPairs.has(pair)) pairCounts[pair] = (pairCounts[pair] ?? 0) + 1;
    }
  }
  const newPairs = Object.keys(pairCounts)
    .sort((a, b) => (pairCounts[b] ?? 0) - (pairCounts[a] ?? 0))
    .slice(0, PAIR_CAP);
  const coveredKinds: ActionKind[] = [];
  kindSet.forEach((k) => coveredKinds.push(k));
  coveredKinds.sort();
  return {
    version: 1,
    sessionId,
    capturedAt,
    newPairs,
    coveredKinds,
    missingVerbs: Array.from(missingSet).sort(),
    combatMethod: combat,
    consumed: false,
  };
}

/** 아직 소비되지 않은 델타에 다음 세션 차이를 합친다. 학습 1회가 두 세션을 모두 본다. */
export function mergeHumanDelta(prev: HumanDeltaFile, next: HumanDeltaFile): HumanDeltaFile {
  const newPairs: string[] = [];
  const seen = new Set<string>();
  const pushPair = (pair: string): void => {
    if (!pair || seen.has(pair) || newPairs.length >= PAIR_CAP) return;
    seen.add(pair);
    newPairs.push(pair);
  };
  for (let i = 0; i < prev.newPairs.length; i += 1) pushPair(prev.newPairs[i]);
  for (let i = 0; i < next.newPairs.length; i += 1) pushPair(next.newPairs[i]);
  const kinds = new Set<ActionKind>();
  for (let i = 0; i < prev.coveredKinds.length; i += 1) kinds.add(prev.coveredKinds[i]);
  for (let i = 0; i < next.coveredKinds.length; i += 1) kinds.add(next.coveredKinds[i]);
  const missing = new Set<string>();
  for (let i = 0; i < prev.missingVerbs.length; i += 1) missing.add(prev.missingVerbs[i]);
  for (let i = 0; i < next.missingVerbs.length; i += 1) missing.add(next.missingVerbs[i]);
  const newer = next.capturedAt >= prev.capturedAt ? next : prev;
  const coveredKinds: ActionKind[] = [];
  kinds.forEach((k) => coveredKinds.push(k));
  coveredKinds.sort();
  return {
    version: 1,
    sessionId: newer.sessionId,
    capturedAt: newer.capturedAt,
    newPairs,
    coveredKinds,
    missingVerbs: Array.from(missing).sort(),
    combatMethod: prev.combatMethod === 'present' || next.combatMethod === 'present' ? 'present' : 'absent',
    consumed: false,
  };
}

export function writeHumanDelta(dir: string, delta: HumanDeltaFile): string {
  fs.mkdirSync(dir, { recursive: true });
  const dest = humanDeltaPath(dir);
  atomicWrite(dest, `${JSON.stringify(delta, null, 2)}\n`);
  return dest;
}

export function readHumanDelta(dir: string): HumanDeltaFile | null {
  const dest = humanDeltaPath(dir);
  try {
    if (!fs.existsSync(dest)) return null;
    const raw: unknown = JSON.parse(fs.readFileSync(dest, 'utf8'));
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as HumanDeltaFile;
    if (o.version !== 1 || typeof o.sessionId !== 'string' || !Array.isArray(o.newPairs)) return null;
    return o;
  } catch {
    return null;
  }
}

export function readUnconsumedHumanDelta(dir: string): HumanDeltaFile | null {
  const d = readHumanDelta(dir);
  if (!d || d.consumed) return null;
  return d;
}

export function consumeHumanDelta(dir: string): void {
  const d = readHumanDelta(dir);
  if (!d || d.consumed) return;
  d.consumed = true;
  d.consumedAt = new Date().toISOString();
  writeHumanDelta(dir, d);
}
