/**
 * 바 공연 보이스 — Metro 정적 require 맵.
 * 재생 포맷은 mp3 만. 같은 스템의 wav/srt 는 두지 않는다.
 *
 * 향후 곡 교체:
 *   1) assets/audio/voice/{key}.mp3 추가
 *   2) 아래에 require 1줄
 *   3) tables/content/bar_voice_clips.csv 에 songId 행 추가 후 build:bar-voice-clips
 */
export type BarVoiceAssetModule = number;

const BAR_VOICE_ASSET_SOURCES: Record<string, BarVoiceAssetModule> = {
  'voice/testbargirl_01': require('../../assets/audio/voice/testbargirl_01.mp3'),
  'voice/bargirlmusic01': require('../../assets/audio/voice/bargirlmusic01.mp3'),
};

export function getBarVoiceAssetSource(assetKey: string): BarVoiceAssetModule | null {
  const key = String(assetKey ?? '').trim();
  if (!key) return null;
  const src = BAR_VOICE_ASSET_SOURCES[key];
  return typeof src === 'number' ? src : null;
}

export function listRegisteredBarVoiceAssetKeys(): string[] {
  return Object.keys(BAR_VOICE_ASSET_SOURCES);
}
