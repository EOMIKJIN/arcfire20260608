import type { ImageSourcePropType } from 'react-native';

const NPC_CAPTAIN_PORTRAIT_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {
  'assets/images/npc/stella_aris_char001.png': require('../../assets/images/npc/stella_aris_char001.png'),
  'assets/images/npc/mia_bello_char002.png': require('../../assets/images/npc/mia_bello_char002.png'),
  'assets/images/npc/noname_char007.png': require('../../assets/images/npc/noname_char007.png'),
  'assets/images/npc/noname_char008.png': require('../../assets/images/npc/noname_char008.png'),
  'assets/images/npc/noname_char010.png': require('../../assets/images/npc/noname_char010.png'),
  /** story_scene_pages 레거시 키 — npc/ 하위와 동일 에셋 */
  'assets/images/stella_aris_char001.png': require('../../assets/images/npc/stella_aris_char001.png'),
};

export function resolveNpcCaptainPortraitSource(
  key: string | undefined | null,
): ImageSourcePropType | null {
  if (key == null) return null;
  const k = String(key).trim();
  if (!k) return null;
  return NPC_CAPTAIN_PORTRAIT_BY_ASSET_KEY[k] ?? null;
}

