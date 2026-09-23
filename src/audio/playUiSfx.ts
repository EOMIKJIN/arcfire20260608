import { playUiSfx as playUiSfxAsync } from './uiSfxPlayer';
import type { UiSfxCue } from './uiSfxTypes';

/**
 * 버튼 눌림(onPressIn) 동기 호출용 — Promise는 fire-and-forget.
 * 동작(닫기·전환)과 분리. await 로 제스처를 막지 않음.
 */
export function playUiSfx(cue: UiSfxCue = 'ui_click'): void {
  void playUiSfxAsync(cue);
}

export type { UiSfxCue };
