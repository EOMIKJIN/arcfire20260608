/**
 * S4 — adb logcat [MEM_PROFILE] / owner-playlog → human-seed 재수입.
 * 앱 변경 없음. 18:00 리포트·수동 CLI에서 호출.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { mergeHumanDelta, planHumanDelta, readUnconsumedHumanDelta, writeHumanDelta } from './humanDelta';
import { writeHumanSeed, type HumanSeedV0, type SessionKind } from './humanSeed';
import { memProfileToTraces, orderTopFromTraces } from './memProfileToSessionTrace';
import { learnedDir } from './policy';
import { toolRoot } from './io';

const PULL_CAP_LINES = 4000;
const ADB_TIMEOUT_MS = 20_000;
const ADB_MAX_BUFFER = 8 * 1024 * 1024;

export type ImportHumanSeedOpts = {
  runId?: string;
  outDir?: string;
  defaultKind?: SessionKind;
  forceKind?: SessionKind;
  capturedFrom?: string;
  capturedAt?: string;
};

export function defaultMemProfilePath(): string {
  return path.join(toolRoot(), '..', 'memory-profiler', 'reports', 'mem-profile-logcat.txt');
}

export function playbotMemProfilePullPath(): string {
  return path.join(learnedDir(), 'mem-profile-logcat-pull.txt');
}

export function ownerPlaylogRoot(): string {
  return path.join(learnedDir(), 'human-raw');
}

function uniqueMemLines(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes('[MEM_PROFILE]')) continue;
    if (seen.has(line)) continue;
    seen.add(line);
    out.push(line);
  }
  return out;
}

export function pullAdbMemProfile(outFile = playbotMemProfilePullPath()): number {
  const r = spawnSync('adb', ['logcat', '-d', '-v', 'time'], {
    encoding: 'utf8',
    timeout: ADB_TIMEOUT_MS,
    maxBuffer: ADB_MAX_BUFFER,
    windowsHide: true,
  });
  if (r.error || r.status !== 0 || !r.stdout) return 0;
  const fresh = uniqueMemLines(r.stdout);
  if (fresh.length === 0) return 0;
  const prev = fs.existsSync(outFile) ? fs.readFileSync(outFile, 'utf8') : '';
  const merged = uniqueMemLines(`${prev}\n${fresh.join('\n')}`);
  const kept = merged.length > PULL_CAP_LINES ? merged.slice(merged.length - PULL_CAP_LINES) : merged;
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${kept.join('\n')}\n`, 'utf8');
  return fresh.length;
}

function fileMtimeMs(file: string): number {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

/** manifest의 사람 판정. pending·누락·미지 = profiler(블렌드 제외). */
export function readOwnerSessionKind(sessionLog: string): SessionKind {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(path.dirname(sessionLog), 'manifest.json'), 'utf8')) as {
      sessionKind?: string;
    };
    if (m.sessionKind === 'human') return 'human';
    if (m.sessionKind === 'qa') return 'qa';
    return 'profiler';
  } catch {
    return 'profiler';
  }
}

/** 종료된 owner-playlog 중 가장 최근 session.log */
export function latestOwnerPlaylogSessionLog(): string | null {
  const base = ownerPlaylogRoot();
  if (!fs.existsSync(base)) return null;
  let best = '';
  let bestM = 0;
  const ents = fs.readdirSync(base, { withFileTypes: true });
  for (let i = 0; i < ents.length; i += 1) {
    const e = ents[i];
    if (!e.isDirectory() || !e.name.startsWith('owner-')) continue;
    const dir = path.join(base, e.name);
    if (fs.existsSync(path.join(dir, 'capture.pid'))) continue;
    const log = path.join(dir, 'session.log');
    if (!fs.existsSync(log)) continue;
    const m = fileMtimeMs(log);
    if (m > bestM) {
      bestM = m;
      best = log;
    }
  }
  return best || null;
}

/** T2 — owner-playlog가 있으면 mtime과 무관하게 항상 우선. pull은 보관만. */
export function pickMemProfileInput(
  candidates: Array<{ file: string; owner: boolean; hasMem: boolean }>,
): { file: string; owner: boolean } | null {
  for (let i = 0; i < candidates.length; i += 1) {
    const c = candidates[i];
    if (c.owner && c.hasMem) return { file: c.file, owner: true };
  }
  for (let i = 0; i < candidates.length; i += 1) {
    const c = candidates[i];
    if (!c.owner && c.hasMem) return { file: c.file, owner: false };
  }
  return null;
}

export function resolveMemProfileInput(): { file: string; owner: boolean } | null {
  const owner = latestOwnerPlaylogSessionLog();
  const pull = playbotMemProfilePullPath();
  const fallback = defaultMemProfilePath();
  return pickMemProfileInput([
    {
      file: owner ?? '',
      owner: true,
      hasMem: !!owner && fs.readFileSync(owner, 'utf8').includes('[MEM_PROFILE]'),
    },
    {
      file: pull,
      owner: false,
      hasMem: fs.existsSync(pull) && fs.readFileSync(pull, 'utf8').includes('[MEM_PROFILE]'),
    },
    {
      file: fallback,
      owner: false,
      hasMem: fs.existsSync(fallback) && fs.readFileSync(fallback, 'utf8').includes('[MEM_PROFILE]'),
    },
  ]);
}

export function importHumanSeedFromMemProfile(
  input: string,
  opts: ImportHumanSeedOpts = {},
): {
  dest: string;
  sessions: number;
  beats: number;
  human: number;
} | null {
  if (!fs.existsSync(input)) return null;
  const capturedAt = opts.capturedAt ?? new Date().toISOString();
  const capturedFrom = opts.capturedFrom ?? path.basename(input);
  const outDir = opts.outDir ?? learnedDir();
  const runId = opts.runId && opts.runId.length > 0
    ? opts.runId
    : (opts.forceKind === 'human' ? 'owner-play' : 'owner-mem');
  const traces = memProfileToTraces(fs.readFileSync(input, 'utf8'), runId, {
    capturedFrom,
    capturedAt,
    defaultKind: opts.defaultKind,
    forceKind: opts.forceKind,
  });
  if (traces.length === 0) return null;
  const seed: HumanSeedV0 = {
    version: 1,
    player: 'owner',
    updatedAt: capturedAt,
    source: 'mem_profile',
    capturedFrom,
    capturedAt,
    traces,
    orderTop: orderTopFromTraces(traces),
  };
  const delta = planHumanDelta(outDir, traces);
  const dest = writeHumanSeed(outDir, seed);
  if (delta) {
    const pending = readUnconsumedHumanDelta(outDir);
    writeHumanDelta(outDir, pending ? mergeHumanDelta(pending, delta) : delta);
  }
  return {
    dest,
    sessions: traces.length,
    beats: traces.reduce((n, t) => n + t.beats.length, 0),
    human: traces.filter((t) => t.sessionKind !== 'qa' && t.sessionKind !== 'profiler').length,
  };
}

export function refreshHumanSeedForDaily(opts?: { force?: boolean }): {
  imported: boolean;
  reason: string;
  pulled?: number;
} {
  let pulled = 0;
  try {
    pulled = pullAdbMemProfile();
  } catch {
    pulled = 0;
  }
  // T2/T3 — 시드에는 대표님 실기(owner-playlog, 수집 데몬이 human 판정한 세션)만.
  // 기기 전체 pull·프로파일러 파일은 사람/자동 구분이 안 되므로 보관만 하고 수입하지 않는다.
  const owner = latestOwnerPlaylogSessionLog();
  if (!owner || !fs.readFileSync(owner, 'utf8').includes('[MEM_PROFILE]')) {
    return { imported: false, reason: 'no_owner_playlog', pulled };
  }
  const ownerKind = readOwnerSessionKind(owner);
  if (ownerKind !== 'human') {
    return { imported: false, reason: `owner_not_human:${ownerKind}`, pulled };
  }
  const seedFile = path.join(learnedDir(), 'human-seed-v0.json');
  if (!opts?.force && fs.existsSync(seedFile) && fileMtimeMs(owner) <= fileMtimeMs(seedFile)) {
    return { imported: false, reason: 'seed_fresh', pulled };
  }
  const resolved = { file: owner, owner: true };
  const out = importHumanSeedFromMemProfile(resolved.file, {
    defaultKind: 'human',
    runId: path.basename(path.dirname(resolved.file)),
    capturedFrom: path.basename(path.dirname(resolved.file)),
  });
  if (!out) return { imported: false, reason: 'mem_profile_no_beats', pulled };
  return {
    imported: true,
    reason: `sessions=${out.sessions} human=${out.human} beats=${out.beats}`,
    pulled,
  };
}
