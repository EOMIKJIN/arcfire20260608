/**
 * 인게임 대사 종료 후 1회 콜백 — 틱/인터벌 없음.
 * mission 모듈을 import 하지 않음(순환 방지).
 * 기능 연결(idleCallbacks)만 1.5초 딜레이. 셸 flush 구독은 즉시.
 */

import { runAfterIngameDialogFeatureLinkDelay } from './ingameDialogFeatureLink';

const idleCallbacks: Array<() => void> = [];
const becameIdleListeners: Array<() => void> = [];

/** 대사 진행 중일 때만 등록. 호출측에서 isIngameDialogActive() 확인. */
export function runAfterIngameDialogIdle(fn: () => void): void {
  idleCallbacks.push(fn);
}

/** presentPending 등 — 대사 모듈이 mission을 직접 import하지 않도록 구독만. */
export function subscribeIngameDialogBecameIdle(fn: () => void): () => void {
  becameIdleListeners.push(fn);
  return () => {
    const idx = becameIdleListeners.indexOf(fn);
    if (idx >= 0) becameIdleListeners.splice(idx, 1);
  };
}

function notifyIngameDialogBecameIdle(): void {
  const listeners = becameIdleListeners.slice();
  for (let i = 0; i < listeners.length; i += 1) {
    listeners[i]!();
  }
}

/** 대기 중인 다음 대사 present만 폐기. becameIdle 구독은 유지. */
export function cancelQueuedIngameDialogIdlePresents(): void {
  idleCallbacks.length = 0;
}

export function drainIngameDialogIdleCallbacks(): void {
  if (idleCallbacks.length === 0 && becameIdleListeners.length === 0) return;
  const queued = idleCallbacks.splice(0, idleCallbacks.length);
  notifyIngameDialogBecameIdle();
  if (queued.length === 0) return;
  runAfterIngameDialogFeatureLinkDelay(() => {
    for (let i = 0; i < queued.length; i += 1) {
      queued[i]!();
    }
  });
}

/** 첫 창 무입력 자동닫힘 — 남은 대기 대사는 실행하지 않고 idle만 알린다. */
export function cancelIngameDialogIdlePresentsAndNotify(): void {
  cancelQueuedIngameDialogIdlePresents();
  notifyIngameDialogBecameIdle();
}
