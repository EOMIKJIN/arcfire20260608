import { playUiSfx } from './playUiSfx';
import type { UiSfxCue } from './uiSfxTypes';

type BindOpts = {
  cue?: UiSfxCue;
  /** true 이면 재생 안 함 (disabled / busy) */
  silent?: boolean;
  onPressIn?: () => void;
};

/**
 * Pressable/Touchable onPressIn 에 UI SFX를 붙인다.
 * 클릭연출(pressed)과 동일 시점에 재생.
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
