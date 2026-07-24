import { Image, type ImageSourcePropType } from 'react-native';

/**
 * CSV `portraitImageAssetKey` → Metro 정적 require.
 * 새 PNG: assets/images/npc/ 저장 후 아래 맵에 **동일 키** 등록.
 * 계약: docs/NPC_CAPTAIN_PORTRAIT_ASSET_CONTRACT.md
 * 금지: listCriticalSessionImageSources 에 함장 초상 전수 편입.
 */
const NPC_CAPTAIN_PORTRAIT_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {
  'assets/images/npc/stella_aris_char001.png': require('../../assets/images/npc/stella_aris_char001.png'),
  'assets/images/npc/mia_bello_char002.png': require('../../assets/images/npc/mia_bello_char002.png'),
  'assets/images/npc/noname_char003.png': require('../../assets/images/npc/noname_char003.png'),
  'assets/images/npc/noname_char004.png': require('../../assets/images/npc/noname_char004.png'),
  'assets/images/npc/noname_char005.png': require('../../assets/images/npc/noname_char005.png'),
  'assets/images/npc/noname_char006.png': require('../../assets/images/npc/noname_char006.png'),
  'assets/images/npc/noname_char007.png': require('../../assets/images/npc/noname_char007.png'),
  'assets/images/npc/noname_char008.png': require('../../assets/images/npc/noname_char008.png'),
  'assets/images/npc/noname_char009.png': require('../../assets/images/npc/noname_char009.png'),
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

/** 등록된 초상 목록 — 선택적 워밍 전용. 부트 critical 전수 prefetch에 쓰지 말 것. */
export function listNpcCaptainPortraitSources(): ImageSourcePropType[] {
  return Object.values(NPC_CAPTAIN_PORTRAIT_BY_ASSET_KEY);
}

/** 번들 PNG 원본 width ÷ height — 사진 열 가로를 원본 비율로 맞출 때 사용 */
export function resolveNpcCaptainPortraitAspectRatio(
  source: ImageSourcePropType | null | undefined,
): number | null {
  if (source == null) return null;
  const resolved = Image.resolveAssetSource(source);
  const w = resolved?.width;
  const h = resolved?.height;
  if (!w || !h) return null;
  return w / h;
}
