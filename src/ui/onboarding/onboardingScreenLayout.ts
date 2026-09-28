// ============================================================
// 온보딩·폼 화면 헤더 — 모바일 웹/앱 관례 (iOS HIG · Material compact page)
//
// - SafeArea는 StageShell SafeAreaView가 처리 — insets.top을 다시 더하지 않음
// - STAGE_TOP_INSET_PX(72)는 행성 허브용 — 온보딩은 topInset={false}
// - 페이지 제목: safe area 직후 12px (8–16dp 권장 구간)
// - 제목↔부제 8px · 헤더 블록↔본문 16px
// ============================================================

import { OVERLAY_TOKENS } from '../../utils/theme';

/** 별/암배경 온보딩 제목 — 시설 카드용 어두운 titleInk 대신 포스포르 액센트 */
export const ONBOARDING_TITLE_INK = OVERLAY_TOKENS.phosphorAccent;

/** SafeArea 하단 경계 직후 제목까지 간격 */
export const ONBOARDING_COMPACT_HEADER_TOP_PX = 12;

/** H1 ↔ 부제/설명 */
export const ONBOARDING_TITLE_SUBTITLE_GAP_PX = 8;

/** 헤더 블록 ↔ 스크롤·입력 등 본문 */
export const ONBOARDING_HEADER_BODY_GAP_PX = 16;

/**
 * 캐릭터 선택 — 부제 없을 때 제목 위치 보정(레거시).
 * 부제를 다시 쓰는 화면은 compact top + 제목 + 부제를 쓴다.
 */
export const ONBOARDING_CHARACTER_SELECT_HEADER_TOP_PX =
  ONBOARDING_COMPACT_HEADER_TOP_PX +
  ONBOARDING_TITLE_SUBTITLE_GAP_PX +
  40 +
  ONBOARDING_HEADER_BODY_GAP_PX;
