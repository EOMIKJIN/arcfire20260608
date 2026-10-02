import fs from 'node:fs';
import path from 'node:path';

/** 학습 상태 디스크 상한 — 가상일마다 100KB 재기록 금지. */
export const LEARN_FLUSH_MIN_MS = 5 * 60 * 1000;
export const POLICY_FLUSH_MIN_MS = 10 * 60 * 1000;
/** 가상일 강제 기록 없음 — 벽시계 5분만. 16일은 ≈42초라 목표를 깬다. */

type Kind = 'learning' | 'policy';

type Pending = { dest: string; body: string };

const pending: Record<Kind, Pending | null> = { learning: null, policy: null };
const lastFlushAt: Record<Kind, number> = { learning: 0, policy: 0 };
const lastBody: Record<Kind, string> = { learning: '', policy: '' };

let immediate = false;
let minMsOverride: Partial<Record<Kind, number>> | null = null;

export type DurableLoad<T> = {
  value: T;
  recovered: boolean;
  corrupt: boolean;
};

export function setLearnedImmediateForTest(on: boolean): void {
  immediate = on;
  if (on) {
    pending.learning = null;
    pending.policy = null;
  }
}

export function setLearnedMinFlushMsForTest(ms: Partial<Record<Kind, number>> | null): void {
  minMsOverride = ms;
}

export function resetLearnedIoForTest(): void {
  pending.learning = null;
  pending.policy = null;
  lastFlushAt.learning = 0;
  lastFlushAt.policy = 0;
  lastBody.learning = '';
  lastBody.policy = '';
  minMsOverride = null;
  immediate = true;
}

function minMs(kind: Kind): number {
  if (immediate) return 0;
  if (kind === 'learning') return minMsOverride?.learning ?? LEARN_FLUSH_MIN_MS;
  return minMsOverride?.policy ?? POLICY_FLUSH_MIN_MS;
}

/** 같은 볼륨에서 tmp→rename. Windows는 rename 실패 시 copy. 직전 성공본은 .bak */
export function atomicWriteFile(dest: string, body: string): boolean {
  const dir = path.dirname(dest);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(dest)}.${process.pid}.${Date.now()}.tmp`);
  try {
    fs.writeFileSync(tmp, body, 'utf8');
    if (fs.existsSync(dest)) {
      try {
        fs.copyFileSync(dest, `${dest}.bak`);
      } catch {
        /* bak 실패해도 본기록은 시도 */
      }
    }
    try {
      fs.renameSync(tmp, dest);
    } catch {
      fs.copyFileSync(tmp, dest);
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* leftover tmp */
      }
    }
    return true;
  } catch {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    return false;
  }
}

export function loadJsonDurable<T>(
  dest: string,
  empty: T,
  ok: (raw: unknown) => raw is T,
): DurableLoad<T> {
  const parse = (file: string): T | null => {
    try {
      if (!fs.existsSync(file)) return null;
      const raw: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
      return ok(raw) ? raw : null;
    } catch {
      return null;
    }
  };
  const primary = parse(dest);
  if (primary) return { value: primary, recovered: false, corrupt: false };
  const bak = parse(`${dest}.bak`);
  if (bak) {
    atomicWriteFile(dest, JSON.stringify(bak, null, 2));
    return { value: bak, recovered: true, corrupt: true };
  }
  return { value: empty, recovered: false, corrupt: fs.existsSync(dest) };
}

export function scheduleLearnedWrite(kind: Kind, dest: string, body: string, force = false): boolean {
  if (body === lastBody[kind] && !force) return false;
  pending[kind] = { dest, body };
  const now = Date.now();
  if (!force && now - lastFlushAt[kind] < minMs(kind)) return false;
  return flushLearnedKind(kind);
}

export function flushLearnedKind(kind: Kind): boolean {
  const row = pending[kind];
  if (!row) return true;
  const ok = atomicWriteFile(row.dest, row.body);
  if (ok) {
    lastBody[kind] = row.body;
    lastFlushAt[kind] = Date.now();
    pending[kind] = null;
  }
  return ok;
}

export function flushLearnedWrites(): boolean {
  const a = flushLearnedKind('learning');
  const b = flushLearnedKind('policy');
  return a && b;
}

export function shouldForceLearnFlush(day: number): boolean {
  if (immediate) return true;
  return day <= 1;
}
