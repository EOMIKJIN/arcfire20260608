/**
 * UI 전환 보호막 — 팝업·대사·메뉴·STAGE 가 같은 문을 쓴다.
 * kind/화면 분기 없음. 틱·persist 없음. 타이머는 settle 1 + deadline 1.
 */

export type UiTransitionSettleKind = 'press' | 'open' | 'close';

const DEFAULT_PRESS_SETTLE_MS = 80;
const DEFAULT_OPEN_SETTLE_MS = 100;
const DEFAULT_CLOSE_SETTLE_MS = 160;
const DEFAULT_HARD_DEADLINE_MS = 2000;

let pressSettleMs = DEFAULT_PRESS_SETTLE_MS;
let openSettleMs = DEFAULT_OPEN_SETTLE_MS;
let closeSettleMs = DEFAULT_CLOSE_SETTLE_MS;
let hardDeadlineMs = DEFAULT_HARD_DEADLINE_MS;

let busy = false;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
let deadlineTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emitBusy(): void {
  listeners.forEach((fn) => {
    fn();
  });
}

function settleMsFor(kind: UiTransitionSettleKind): number {
  if (kind === 'open') return openSettleMs;
  if (kind === 'close') return closeSettleMs;
  return pressSettleMs;
}

function clearSettleTimer(): void {
  if (!settleTimer) return;
  clearTimeout(settleTimer);
  settleTimer = null;
}

function clearDeadlineTimer(): void {
  if (!deadlineTimer) return;
  clearTimeout(deadlineTimer);
  deadlineTimer = null;
}

function enterBusy(): void {
  const wasBusy = busy;
  busy = true;
  clearDeadlineTimer();
  deadlineTimer = setTimeout(() => {
    deadlineTimer = null;
    resetUiTransitionGuard();
  }, hardDeadlineMs);
  if (!wasBusy) emitBusy();
}

function bumpSettle(kind: UiTransitionSettleKind): void {
  clearSettleTimer();
  settleTimer = setTimeout(() => {
    settleTimer = null;
    clearDeadlineTimer();
    if (!busy) return;
    busy = false;
    emitBusy();
  }, settleMsFor(kind));
}

export function isUiTransitionBusy(): boolean {
  return busy;
}

export function subscribeUiTransitionBusy(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 첫 탭만 수락. 전환 중 두 번째 탭은 버린다. */
export function tryArmUiTransition(): boolean {
  if (busy) return false;
  enterBusy();
  return true;
}

/** 레이어 present/dismiss — 거절하지 않고 settle만 연장. */
export function noteUiLayerChange(kind: 'open' | 'close'): void {
  enterBusy();
  bumpSettle(kind);
}

export function bumpUiTransitionSettle(kind: UiTransitionSettleKind): void {
  if (!busy) {
    enterBusy();
  }
  bumpSettle(kind);
}

export function resetUiTransitionGuard(): void {
  clearSettleTimer();
  clearDeadlineTimer();
  if (!busy) return;
  busy = false;
  emitBusy();
}

/** 테스트 전용 — 실기 경로에서 호출하지 않는다. */
export function configureUiTransitionGuardForTest(opts?: {
  pressMs?: number;
  openMs?: number;
  closeMs?: number;
  deadlineMs?: number;
}): void {
  pressSettleMs = opts?.pressMs ?? DEFAULT_PRESS_SETTLE_MS;
  openSettleMs = opts?.openMs ?? DEFAULT_OPEN_SETTLE_MS;
  closeSettleMs = opts?.closeMs ?? DEFAULT_CLOSE_SETTLE_MS;
  hardDeadlineMs = opts?.deadlineMs ?? DEFAULT_HARD_DEADLINE_MS;
  resetUiTransitionGuard();
}
