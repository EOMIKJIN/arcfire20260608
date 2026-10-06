import fs from 'node:fs';
import path from 'node:path';
import { toolRoot } from './io';
import { learnedDir } from './policy';

/** 원본 플레이 로그 상한. 학습 결과(logs/learned)는 삭제하지 않는다. */
export const RAW_CAP_BYTES = 1024 * 1024 * 1024;

const RAW_NAMES = new Set([
  'journal.ndjson',
  'mud.log',
  'timeline.csv',
  'ANALYZE_LATEST.md',
  'kpi.json',
  'compare.csv',
]);

/** pid·플래그·18:00 원장은 1GB 리셋에서도 유지. */
const PROTECT_LOG = new Set([
  'learned',
  'PLAYBOT_RECORDING.flag',
  'PLAYBOT_RECORDING_STOPPED.txt',
  'PLAYBOT_CURRENT_RUN.txt',
  'PLAYBOT_STATUS_LATEST.json',
  'PLAYBOT_DASHBOARD_LATEST.html',
  'PLAYBOT_MUD_LATEST.txt',
  'PLAYBOT_CHAT_REPORT_PENDING.md',
  'PLAYBOT_DAILY_TRIAGE_LATEST.md',
  'DAILY_18_PLAYBOT_LEARNING_LATEST.md',
  'playbot-learning-daily-ledger.csv',
  'playbot-console.pid',
  'playbot-harness.pid',
  'schedule-6pm-playbot.log',
]);

function isProtectedLogName(name: string): boolean {
  if (PROTECT_LOG.has(name)) return true;
  if (name.endsWith('.pid')) return true;
  if (name.startsWith('playbot-learning-daily-')) return true;
  if (name.startsWith('DAILY_')) return true;
  return false;
}

function addSize(file: string): number {
  try {
    return fs.statSync(file).size;
  } catch {
    return 0;
  }
}

function walkBytes(dir: string, skipDirName: string | null): number {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const ents = fs.readdirSync(dir, { withFileTypes: true });
  for (let i = 0; i < ents.length; i += 1) {
    const e = ents[i];
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skipDirName && e.name === skipDirName) continue;
      total += walkBytes(p, null);
      continue;
    }
    total += addSize(p);
  }
  return total;
}

export function measureRawBytes(root = toolRoot()): number {
  const runs = path.join(root, 'runs');
  const logs = path.join(root, 'logs');
  let n = walkBytes(runs, null);
  if (fs.existsSync(logs)) {
    const ents = fs.readdirSync(logs, { withFileTypes: true });
    for (let i = 0; i < ents.length; i += 1) {
      const e = ents[i];
      if (e.name === 'learned') continue;
      const p = path.join(logs, e.name);
      if (e.isDirectory()) n += walkBytes(p, null);
      else n += addSize(p);
    }
  }
  return n;
}

function rmrf(target: string): void {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

function runMtime(dir: string): number {
  try {
    return fs.statSync(dir).mtimeMs;
  } catch {
    return 0;
  }
}

/** 닫힌 profiler 수집 세션 보관 기간. 사람·미판정 세션은 기간과 무관하게 남긴다. */
export const PROFILER_RAW_KEEP_MS = 3 * 24 * 60 * 60 * 1000;
const PROFILER_PRUNE_EVERY_MS = 60 * 60 * 1000;
let lastProfilerPruneMs = 0;

/**
 * learned/human-raw 의 닫힌 profiler 세션 중 오래된 것만 지운다.
 * 학습은 human 세션만, 세포 반복은 열린 세션(capture.pid)만 읽는다.
 */
export function pruneProfilerHumanRaw(input?: { dir?: string; nowMs?: number; keepMs?: number }): number {
  const root = path.join(input?.dir ?? learnedDir(), 'human-raw');
  if (!fs.existsSync(root)) return 0;
  const now = input?.nowMs ?? Date.now();
  const keep = input?.keepMs ?? PROFILER_RAW_KEEP_MS;
  let removed = 0;
  const ents = fs.readdirSync(root, { withFileTypes: true });
  for (let i = 0; i < ents.length; i += 1) {
    if (!ents[i].isDirectory()) continue;
    const dir = path.join(root, ents[i].name);
    if (fs.existsSync(path.join(dir, 'capture.pid'))) continue;
    let kind = '';
    try {
      kind = String((JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')) as { sessionKind?: string }).sessionKind ?? '');
    } catch {
      continue;
    }
    if (kind !== 'profiler') continue;
    if (now - runMtime(dir) < keep) continue;
    rmrf(dir);
    removed += 1;
  }
  return removed;
}

export function resetRawPlayData(input?: { capBytes?: number; root?: string }): {
  reset: boolean;
  bytes: number;
  cap: number;
} {
  const root = input?.root ?? toolRoot();
  const cap = input?.capBytes ?? RAW_CAP_BYTES;
  if (!input?.root && Date.now() - lastProfilerPruneMs >= PROFILER_PRUNE_EVERY_MS) {
    lastProfilerPruneMs = Date.now();
    try {
      pruneProfilerHumanRaw();
    } catch {
      /* 다음 시간에 다시 */
    }
  }
  const bytes = measureRawBytes(root);
  if (bytes < cap) return { reset: false, bytes, cap };

  const runs = path.join(root, 'runs');
  if (fs.existsSync(runs)) {
    const dirs = fs.readdirSync(runs, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => path.join(runs, e.name))
      .sort((a, b) => runMtime(a) - runMtime(b));
    for (let i = 0; i < dirs.length; i += 1) {
      if (measureRawBytes(root) < cap * 0.7) break;
      rmrf(dirs[i]);
    }
  }

  const logs = path.join(root, 'logs');
  if (fs.existsSync(logs) && measureRawBytes(root) >= cap * 0.7) {
    const ents = fs.readdirSync(logs, { withFileTypes: true });
    for (let i = 0; i < ents.length; i += 1) {
      if (isProtectedLogName(ents[i].name)) continue;
      rmrf(path.join(logs, ents[i].name));
    }
  }

  fs.mkdirSync(path.join(root, 'runs'), { recursive: true });
  fs.mkdirSync(learnedDir(), { recursive: true });
  fs.mkdirSync(logs, { recursive: true });
  const stamp = path.join(learnedDir(), 'raw-reset-ledger.ndjson');
  fs.appendFileSync(
    stamp,
    `${JSON.stringify({ at: new Date().toISOString(), bytes, cap, kept: 'learned/+ops' })}\n`,
    'utf8',
  );
  return { reset: true, bytes, cap };
}

export function pruneRunFiles(runDir: string): void {
  if (!fs.existsSync(runDir)) return;
  const ents = fs.readdirSync(runDir);
  for (let i = 0; i < ents.length; i += 1) {
    if (RAW_NAMES.has(ents[i])) {
      try {
        fs.unlinkSync(path.join(runDir, ents[i]));
      } catch {
        /* ignore */
      }
    }
  }
}
