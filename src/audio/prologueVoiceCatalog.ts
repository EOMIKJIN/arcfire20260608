/** intro01 영화 프롤로그 1·2·3장. 파일명은 저장된 철자(prolugue) 그대로. */
export const PROLOGUE_VOICE_SCENE_ID = 'intro01';

export const PROLOGUE_VOICE_FILE_STEMS = ['prolugue_001', 'prolugue_002', 'prolugue_003'] as const;

export type PrologueVoiceStem = (typeof PROLOGUE_VOICE_FILE_STEMS)[number];

export function resolvePrologueVoiceStem(sceneId: string, pageIndex: number): PrologueVoiceStem | null {
  if (sceneId !== PROLOGUE_VOICE_SCENE_ID) return null;
  if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= PROLOGUE_VOICE_FILE_STEMS.length) {
    return null;
  }
  return PROLOGUE_VOICE_FILE_STEMS[pageIndex] ?? null;
}
