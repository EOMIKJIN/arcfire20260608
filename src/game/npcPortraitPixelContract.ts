/**
 * NPC·바 종업원 초상 PNG 범용 픽셀 규격.
 * 정본 샘플: `assets/images/npc/noname_char007.png` (대표님 정사각 기준)
 * 톤·군복 제작: `docs/NPC_PORTRAIT_PRODUCTION_CANON.md`
 * 교차: `docs/NPC_CAPTAIN_PORTRAIT_ASSET_CONTRACT.md`
 */
export const NPC_PORTRAIT_CANONICAL_WIDTH_PX = 240;
export const NPC_PORTRAIT_CANONICAL_HEIGHT_PX = 240;
/** width ÷ height — UI aspect 계산·검수용 */
export const NPC_PORTRAIT_CANONICAL_ASPECT =
  NPC_PORTRAIT_CANONICAL_WIDTH_PX / NPC_PORTRAIT_CANONICAL_HEIGHT_PX;
/** 정본 파일(규격 앵커) */
export const NPC_PORTRAIT_CANONICAL_SAMPLE_REL =
  'assets/images/npc/noname_char007.png';
/** 하사웨이 셀·허리업 구도 정본 */
export const NPC_PORTRAIT_TONE_CANON_REL =
  'assets/images/npc/bar_att_char016.png';
/** 스텔리움 연합 기본군복(여 · 네이비 근무정복) */
export const STELLIUM_DUTY_UNIFORM_FEMALE_REL =
  'assets/images/npc/noname_char005.png';
/** 스텔리움 연합 정복(남 · 화이트 예복) */
export const STELLIUM_DRESS_UNIFORM_MALE_REL =
  'assets/images/npc/noname_char010.png';
