import type { UiSfxCue } from './uiSfxTypes';

/**
 * UI SFX 리소스 맵 (Table/에셋 정본 슬롯).
 *
 * 완료 방법 — 아래 경로에 파일을 두고 주석의 require 를 활성화한다.
 * Metro는 정적 require 만 번들하므로, 파일 없이 require 하면 빌드가 깨진다.
 *
 * 권장 경로:
 *   assets/audio/ui/click.mp3
 *   assets/audio/ui/confirm.mp3
 *   assets/audio/ui/cancel.mp3
 *   assets/audio/ui/back.mp3
 *   assets/audio/ui/close.mp3
 *
 * 미등록 cue 는 재생 시 silent no-op (기반 배선은 이미 동작).
 */
export type UiSfxAssetModule = number;

const UI_SFX_ASSET_SOURCES: Partial<Record<UiSfxCue, UiSfxAssetModule>> = {
  // ui_click: require('../../assets/audio/ui/click.mp3'),
  // ui_confirm: require('../../assets/audio/ui/confirm.mp3'),
  // ui_cancel: require('../../assets/audio/ui/cancel.mp3'),
  // ui_back: require('../../assets/audio/ui/back.mp3'),
  // ui_close: require('../../assets/audio/ui/close.mp3'),
};

export function getUiSfxAssetSource(cue: UiSfxCue): UiSfxAssetModule | null {
  const src = UI_SFX_ASSET_SOURCES[cue];
  return typeof src === 'number' ? src : null;
}

export function listRegisteredUiSfxCues(): UiSfxCue[] {
  const out: UiSfxCue[] = [];
  for (const cue of Object.keys(UI_SFX_ASSET_SOURCES) as UiSfxCue[]) {
    if (typeof UI_SFX_ASSET_SOURCES[cue] === 'number') out.push(cue);
  }
  return out;
}
