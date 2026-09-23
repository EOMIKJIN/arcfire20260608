/**
 * 전경 순차 규칙 — 화면 셸(메뉴·데이터·첫 프레임)이 끝난 뒤에만 진입 대사/오퍼.
 * 틱/루프 없음. pending 상한 4. 화면 blur 시 폐기.
 */

import { subscribeIngameDialogBecameIdle } from '../../game/ingameDialog/ingameDialogIdle';

const PENDING_CAP = 4;

type ScreenShell = {
  id: string;
  ready: boolean;
};

let shell: ScreenShell | null = null;
const pending: Array<() => void> = [];
let dialogBusyFn: () => boolean = () => false;

export function bindUiSequenceDialogBusy(fn: () => boolean): void {
  dialogBusyFn = fn;
}

function isDialogBusy(): boolean {
  return dialogBusyFn();
}

export function beginUiScreenShell(id: string): void {
  const trimmed = id.trim();
  if (!trimmed) return;
  shell = { id: trimmed, ready: false };
}

export function markUiScreenShellReady(id: string): void {
  if (!shell || shell.id !== id) return;
  shell.ready = true;
  flushUiScreenReadyTasks();
}

export function endUiScreenShell(id: string): void {
  if (!shell || shell.id !== id) return;
  pending.length = 0;
  shell = null;
}

export function isUiScreenShellReady(): boolean {
  return !shell || shell.ready;
}

export function clearUiForegroundSequence(): void {
  pending.length = 0;
}

export function enqueueAfterUiScreenReady(task: () => void): void {
  if (isUiScreenShellReady() && !isDialogBusy()) {
    task();
    return;
  }
  if (pending.length >= PENDING_CAP) return;
  pending.push(task);
}

export function runWhenUiScreenReady(run: () => boolean, bypass = false): boolean {
  if (bypass || (isUiScreenShellReady() && !isDialogBusy())) {
    return run();
  }
  if (pending.length >= PENDING_CAP) return false;
  pending.push(() => {
    run();
  });
  return true;
}

export function flushUiScreenReadyTasks(): void {
  if (!isUiScreenShellReady()) return;
  if (isDialogBusy()) return;
  const next = pending.shift();
  if (!next) return;
  next();
}

subscribeIngameDialogBecameIdle(() => {
  flushUiScreenReadyTasks();
});
