import { playUiSfx as playUiSfxAsync } from './uiSfxPlayer';
import type { UiSfxCue } from './uiSfxTypes';

/**
 * 버튼 onPressIn 동기 호출용 — Promise는 fire-and-forget.
 * (클릭연출과 같은 프레임에서 트리거; await 로 제스처를 막지 않음)
 */
export function playUiSfx(cue: UiSfxCue = 'ui_click'): void {
  void playUiSfxAsync(cue);
}

export type { UiSfxCue };
