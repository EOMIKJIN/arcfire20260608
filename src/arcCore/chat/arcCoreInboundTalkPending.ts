/**
 * 스텔라 선제 연락 pending — 팝업 없이 [대화] 배지만.
 * 틱/persist 없음. 허브 disarm·purge 시 클리어.
 */
import type { ArcCoreInboundTalkWhySnap } from './arcCoreInboundTalkWhy';

let pending: ArcCoreInboundTalkWhySnap | null = null;
const listeners = new Set<() => void>();
let pendingRev = 0;

function emit(): void {
  pendingRev += 1;
  listeners.forEach((fn) => {
    fn();
  });
}

export function setInboundTalkPending(why: ArcCoreInboundTalkWhySnap): void {
  pending = why;
  emit();
}

export function peekInboundTalkPending(): ArcCoreInboundTalkWhySnap | null {
  return pending;
}

export function consumeInboundTalkPending(): ArcCoreInboundTalkWhySnap | null {
  const snap = pending;
  if (!snap) return null;
  pending = null;
  emit();
  return snap;
}

export function hasInboundTalkPending(): boolean {
  return pending != null;
}

export function clearInboundTalkPending(): void {
  if (!pending) return;
  pending = null;
  emit();
}

export function getInboundTalkPendingRevision(): number {
  return pendingRev;
}

export function subscribeInboundTalkPending(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function resetInboundTalkPendingForTest(): void {
  pending = null;
  pendingRev = 0;
  listeners.clear();
}
