import type { ImageSourcePropType } from 'react-native';

/**
 * 바 종업원 초상 — 1등급 11 + 외곽 예비 9 + 엔드게임 외곽 고유 2.
 * 키 = `assets/images/npc/bar_att_char00N.png`.
 * 예비 9는 이름당 1키(같은 이름이 여러 행성에 나와도 같은 require).
 * 타샤·조이는 core_prime·genesis_origin만.
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
  'assets/images/npc/bar_att_char017.png': require('../../assets/images/npc/bar_att_char017.png'),
  'assets/images/npc/bar_att_char018.png': require('../../assets/images/npc/bar_att_char018.png'),
  'assets/images/npc/bar_att_char019.png': require('../../assets/images/npc/bar_att_char019.png'),
  'assets/images/npc/bar_att_char020.png': require('../../assets/images/npc/bar_att_char020.png'),
  'assets/images/npc/bar_att_char021.png': require('../../assets/images/npc/bar_att_char021.png'),
  'assets/images/npc/bar_att_char022.png': require('../../assets/images/npc/bar_att_char022.png'),
  'assets/images/npc/bar_att_char023.png': require('../../assets/images/npc/bar_att_char023.png'),
  'assets/images/npc/bar_att_char024.png': require('../../assets/images/npc/bar_att_char024.png'),
  'assets/images/npc/bar_att_char025.png': require('../../assets/images/npc/bar_att_char025.png'),
  'assets/images/npc/bar_att_char026.png': require('../../assets/images/npc/bar_att_char026.png'),
  'assets/images/npc/bar_att_char027.png': require('../../assets/images/npc/bar_att_char027.png'),
};

/** 1등급 고유 초상 장수 — 순환 헤드룸 아님 */
export const BAR_ATTENDANT_GRADE1_PORTRAIT_COUNT = 11;
/** 외곽·프론티어 예비 이름 고유 초상 장수 */
export const BAR_ATTENDANT_RESERVE_PORTRAIT_COUNT = 9;
/** 엔드게임 외곽(core_prime·genesis_origin) 고유 초상 장수 */
export const BAR_ATTENDANT_OUTER_UNIQUE_PORTRAIT_COUNT = 2;

export function resolveBarAttendantPortraitAsset(
  key: string | undefined | null,
): ImageSourcePropType | null {
  if (key == null) return null;
  const k = String(key).trim();
  if (!k) return null;
  return BAR_ATTENDANT_PORTRAIT_BY_KEY[k] ?? null;
}
