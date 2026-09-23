import type { StellaLifeAskResolved } from './stellaLifeTypes';

let pending: StellaLifeAskResolved | null = null;
const listeners = new Set<() => void>();
let pendingRev = 0;

function emit(): void {
  pendingRev += 1;
  listeners.forEach((fn) => {
    fn();
  });
}

export function setStellaLifeAskPending(why: StellaLifeAskResolved): void {
  pending = why;
  emit();
}

export function peekStellaLifeAskPending(): StellaLifeAskResolved | null {
  return pending;
}

export function consumeStellaLifeAskPending(): StellaLifeAskResolved | null {
  const snap = pending;
  if (!snap) return null;
  pending = null;
  emit();
  return snap;
}

export function hasStellaLifeAskPending(): boolean {
  return pending != null;
}

export function clearStellaLifeAskPending(): void {
  if (!pending) return;
  pending = null;
  emit();
}

export function subscribeStellaLifeAskPending(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function resetStellaLifeAskPendingForTest(): void {
  pending = null;
  pendingRev = 0;
  listeners.clear();
}
