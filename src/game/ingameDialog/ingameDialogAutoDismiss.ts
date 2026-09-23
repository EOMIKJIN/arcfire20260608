import { ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS } from '../../ui/overlay/overlayAlertContract';
import type { IngameDialogAutoDismissMode, IngameDialogSession } from './ingameDialogTypes';

/** 보고형 인게임 대화(전투 종료·스파이 정보원 등) — 범용 compact 팝업과 동일 40초 */
export const COMBAT_END_OPERATOR_AUTO_DISMISS_MS = ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS;

export function resolveSessionAutoDismissMs(session: IngameDialogSession | null): number {
  if (!session) return 0;
  const ms = session.kind === 'csv_scene' ? session.autoDismissMs : session.payload.autoDismissMs;
  return typeof ms === 'number' && ms > 0 ? ms : 0;
}

export function resolveSessionAutoDismissMode(
  session: IngameDialogSession | null,
): IngameDialogAutoDismissMode {
  if (!session) return 'final_page';
  const mode = session.kind === 'csv_scene'
    ? session.autoDismissMode
    : session.payload.autoDismissMode;
  return mode === 'first_idle' ? 'first_idle' : 'final_page';
}

export function resolveSessionAutoDismissKey(session: IngameDialogSession | null): string | null {
  if (!session) return null;
  return session.kind === 'csv_scene' ? `csv:${session.sceneId}` : `adhoc:${session.adhocId}`;
}

/** 첫 창(페이지 0 · 세그먼트 0) — 이후 [다음]은 입력으로 본다. */
export function isFirstIngameDialogWindow(session: IngameDialogSession | null): boolean {
  if (!session) return false;
  if (session.kind === 'csv_scene') {
    return session.pageIndex === 0 && session.segmentIndex === 0;
  }
  return session.segmentIndex === 0;
}

/**
 * `final_page` — 마지막 보고가 끝난 뒤에만 40초.
 * `first_idle` — 첫 창이 뜨면 바로 무장(타이프라이터 완료 대기 없음).
 */
export function shouldArmSessionAutoDismiss(
  session: IngameDialogSession | null,
  isFinalStep: boolean,
): boolean {
  if (!session || resolveSessionAutoDismissMs(session) <= 0) return false;
  if (resolveSessionAutoDismissMode(session) === 'first_idle') {
    return isFirstIngameDialogWindow(session);
  }
  if (!isFinalStep || !session.pageComplete) return false;
  return true;
}
