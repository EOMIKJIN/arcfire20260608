/**
 * 인앱 대사 ↔ 기능 연결 1.5초 딜레이.
 * 틱/루프 없음. 대기 상한 4. 허브 이탈·행성 변경 시 타이머만 취소(pending 스캔은 유지).
 */

import { registerPlanetSessionResource } from '../planetSessionRegistry';

export const INGAME_DIALOG_FEATURE_LINK_DELAY_MS = 1500;
const PENDING_CAP = 4;

let timer: ReturnType<typeof setTimeout> | null = null;
let sessionRelease: { release: () => void } | null = null;
const pendingRuns: Array<() => void> = [];
let delayMsOverride: number | null = null;

function resolveDelayMs(): number {
  return delayMsOverride ?? INGAME_DIALOG_FEATURE_LINK_DELAY_MS;
}

function resolveBindPlanetId(explicit?: string | null): string | null {
  const raw = (explicit ?? '').trim();
  return raw || null;
}

function flushPendingRuns(): void {
  const batch = pendingRuns.splice(0, pendingRuns.length);
  for (let i = 0; i < batch.length; i += 1) {
    batch[i]!();
  }
}

function clearTimerOnly(): void {
  if (timer != null) {
    clearTimeout(timer);
    timer = null;
  }
  if (sessionRelease) {
    const token = sessionRelease;
    sessionRelease = null;
    token.release();
  }
}

/** 대기 중인 연결 액션까지 폐기. 스테이지 이탈용. */
export function cancelIngameDialogFeatureLinkDelay(): void {
  pendingRuns.length = 0;
  clearTimerOnly();
}

function armTimer(bindPlanetId?: string | null): void {
  if (timer != null) return;
  const planetId = resolveBindPlanetId(bindPlanetId);
  const token = registerPlanetSessionResource({
    ownerId: 'ingame_dialog_feature_link',
    planetId,
    dispose: () => {
      if (timer != null) {
        clearTimeout(timer);
        timer = null;
      }
      sessionRelease = null;
    },
  });
  sessionRelease = token;
  timer = setTimeout(() => {
    timer = null;
    const release = sessionRelease;
    sessionRelease = null;
    const batch = pendingRuns.splice(0, pendingRuns.length);
    release?.release();
    for (let i = 0; i < batch.length; i += 1) {
      batch[i]!();
    }
  }, resolveDelayMs());
}

/**
 * 기능→대사 / 대사→기능 연결을 1.5초 뒤에 1회 실행.
 * 이미 대기 중이면 같은 타이머에 합류(재시작하지 않음).
 */
export function runAfterIngameDialogFeatureLinkDelay(
  run: () => void,
  bindPlanetId?: string | null,
): void {
  if (pendingRuns.length >= PENDING_CAP) return;
  pendingRuns.push(run);
  if (resolveDelayMs() <= 0) {
    flushPendingRuns();
    return;
  }
  armTimer(bindPlanetId);
}

export function hasIngameDialogFeatureLinkPending(): boolean {
  return timer != null || pendingRuns.length > 0;
}

export function setIngameDialogFeatureLinkDelayMsForTest(ms: number | null): void {
  delayMsOverride = ms;
}
