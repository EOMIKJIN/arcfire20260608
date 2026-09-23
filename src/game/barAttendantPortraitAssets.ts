import type { ImageSourcePropType } from 'react-native';

/**
 * 바 종업원 초상 — 1등급 11명 고유 키만 등록. 순환·돌려쓰기 금지.
 * 키 = `planets`와 동일한 `assets/images/npc/bar_att_char00N.png`.
 * 빈 키·미등록 = null (2·3등급 예정 슬롯).
 * 톤 정본 016 = 플룸 고유 초상과 겸용.
 * 금지: listCriticalSessionImageSources 전수 prefetch.
 */
const BAR_ATTENDANT_PORTRAIT_BY_KEY: Readonly<Record<string, ImageSourcePropType>> = {
  'assets/images/npc/bar_att_char006.png': require('../../assets/images/npc/bar_att_char006.png'),
  'assets/images/npc/bar_att_char007.png': require('../../assets/images/npc/bar_att_char007.png'),
  'assets/images/npc/bar_att_char008.png': require('../../assets/images/npc/bar_att_char008.png'),
  'assets/images/npc/bar_att_char009.png': require('../../assets/images/npc/bar_att_char009.png'),
  'assets/images/npc/bar_att_char010.png': require('../../assets/images/npc/bar_att_char010.png'),
  'assets/images/npc/bar_att_char011.png': require('../../assets/images/npc/bar_att_char011.png'),
  'assets/images/npc/bar_att_char012.png': require('../../assets/images/npc/bar_att_char012.png'),
  'assets/images/npc/bar_att_char013.png': require('../../assets/images/npc/bar_att_char013.png'),
  'assets/images/npc/bar_att_char014.png': require('../../assets/images/npc/bar_att_char014.png'),
  'assets/images/npc/bar_att_char015.png': require('../../assets/images/npc/bar_att_char015.png'),
  'assets/images/npc/bar_att_char016.png': require('../../assets/images/npc/bar_att_char016.png'),
};

/** 1등급 고유 초상 장수 — 순환 헤드룸 아님 */
export const BAR_ATTENDANT_GRADE1_PORTRAIT_COUNT = 11;

export function resolveBarAttendantPortraitAsset(
  key: string | undefined | null,
): ImageSourcePropType | null {
  if (key == null) return null;
  const k = String(key).trim();
  if (!k) return null;
  return BAR_ATTENDANT_PORTRAIT_BY_KEY[k] ?? null;
}
