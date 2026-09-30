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

export function resetRawPlayData(input?: { capBytes?: number; root?: string }): {
  reset: boolean;
  bytes: number;
  cap: number;
} {
  const root = input?.root ?? toolRoot();
  const cap = input?.capBytes ?? RAW_CAP_BYTES;
  const bytes = measureRawBytes(root);
  if (bytes < cap) return { reset: false, bytes, cap };
  rmrf(path.join(root, 'runs'));
  const logs = path.join(root, 'logs');
  if (fs.existsSync(logs)) {
    const ents = fs.readdirSync(logs, { withFileTypes: true });
    for (let i = 0; i < ents.length; i += 1) {
      if (ents[i].name === 'learned') continue;
      rmrf(path.join(logs, ents[i].name));
    }
  }
  fs.mkdirSync(path.join(root, 'runs'), { recursive: true });
  fs.mkdirSync(learnedDir(), { recursive: true });
  fs.mkdirSync(logs, { recursive: true });
  const stamp = path.join(learnedDir(), 'raw-reset-ledger.ndjson');
  fs.appendFileSync(
    stamp,
    `${JSON.stringify({ at: new Date().toISOString(), bytes, cap, kept: 'learned/' })}\n`,
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
