import { playUiSfx } from './playUiSfx';
import type { UiSfxCue } from './uiSfxTypes';

type BindOpts = {
  cue?: UiSfxCue;
  /** true 이면 재생 안 함 (disabled / busy) */
  silent?: boolean;
  onPressIn?: () => void;
};

/**
 * Pressable onPressIn 전용 — SFX·눌림 연출만. 동작(페이지 넘김·닫기)은 넣지 말 것.
 * 동작은 뗌(`onPress` / useArcButtonReleaseHandlers).
 */
export function bindUiSfxPressIn(opts: BindOpts = {}): () => void {
  const cue = opts.cue ?? 'ui_click';
  return () => {
    if (opts.silent) {
      opts.onPressIn?.();
      return;
    }
    playUiSfx(cue);
    opts.onPressIn?.();
  };
}
