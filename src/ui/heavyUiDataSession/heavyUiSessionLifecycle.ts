/**
 * Heavy UI hydrate 파이프라인 — STAGE 이탈 시 명시 abort (React state·hydrate 잔류 방지)
 */

const abortBySessionKey = new Map<string, () => void>();

export function registerHeavyUiSessionAbort(sessionKey: string, abort: () => void): () => void {
  abortBySessionKey.set(sessionKey, abort);
  return () => {
    if (abortBySessionKey.get(sessionKey) === abort) {
      abortBySessionKey.delete(sessionKey);
    }
  };
}

export function abortHeavyUiSessions(filter?: { prefix?: string; exact?: string }): number {
  let count = 0;
  for (const [key, abort] of [...abortBySessionKey.entries()]) {
    if (filter?.exact && key !== filter.exact) continue;
    if (filter?.prefix && !key.startsWith(filter.prefix)) continue;
    if (!filter?.exact && !filter?.prefix) continue;
    try {
      abort();
    } catch {
      /* idempotent */
    }
    abortBySessionKey.delete(key);
    count += 1;
  }
  return count;
}

export function abortAllHeavyUiSessions(): number {
  let count = 0;
  for (const abort of abortBySessionKey.values()) {
    try {
      abort();
    } catch {
      /* idempotent */
    }
    count += 1;
  }
  abortBySessionKey.clear();
  return count;
}
