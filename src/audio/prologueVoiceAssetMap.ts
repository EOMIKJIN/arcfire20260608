/**
 * 프롤로그 더빙 — Metro 정적 require.
 * 디스크 파일명: assets/audio/voice/prolugue_00N.mp3
 */
import { PROLOGUE_VOICE_FILE_STEMS, type PrologueVoiceStem } from './prologueVoiceCatalog';

export type PrologueVoiceAssetModule = number;

const PROLOGUE_VOICE_ASSET_SOURCES: Record<PrologueVoiceStem, PrologueVoiceAssetModule> = {
  prolugue_001: require('../../assets/audio/voice/prolugue_001.mp3'),
  prolugue_002: require('../../assets/audio/voice/prolugue_002.mp3'),
  prolugue_003: require('../../assets/audio/voice/prolugue_003.mp3'),
};

export function getPrologueVoiceSource(stem: string): PrologueVoiceAssetModule | null {
  if (!(PROLOGUE_VOICE_FILE_STEMS as readonly string[]).includes(stem)) return null;
  const src = PROLOGUE_VOICE_ASSET_SOURCES[stem as PrologueVoiceStem];
  return typeof src === 'number' ? src : null;
}
