/**
 * UI 버튼 효과음 cue — 클릭연출(onPressIn)과 동기 재생용.
 * 리소스 추가 시 `uiSfxAssetMap.ts`에만 require 연결하면 된다.
 */
export type UiSfxCue =
  | 'ui_click'
  | 'ui_confirm'
  | 'ui_cancel'
  | 'ui_back'
  | 'ui_close';

export const UI_SFX_CUES: readonly UiSfxCue[] = [
  'ui_click',
  'ui_confirm',
  'ui_cancel',
  'ui_back',
  'ui_close',
] as const;
