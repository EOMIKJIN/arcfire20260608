// ============================================================
// 온보딩·폼 화면 헤더 — 모바일 웹/앱 관례 (iOS HIG · Material compact page)
//
// - SafeArea는 StageShell SafeAreaView가 처리 — insets.top을 다시 더하지 않음
// - STAGE_TOP_INSET_PX(72)는 행성 허브용 — 온보딩은 topInset={false}
// - 페이지 제목: safe area 직후 12px (8–16dp 권장 구간)
// - 제목↔부제 8px · 헤더 블록↔본문 16px
// ============================================================

/** SafeArea 하단 경계 직후 제목까지 간격 */
export const ONBOARDING_COMPACT_HEADER_TOP_PX = 12;

/** H1 ↔ 부제/설명 */
export const ONBOARDING_TITLE_SUBTITLE_GAP_PX = 8;

/** 헤더 블록 ↔ 스크롤·입력 등 본문 */
export const ONBOARDING_HEADER_BODY_GAP_PX = 16;

/**
 * 캐릭터 선택 — 부제(2줄 설명) 제거 시 제목 위치 보정
 * = compact top + title↔부제 gap + 2×lineHeight(20) + header↔본문 gap
 */
export const ONBOARDING_CHARACTER_SELECT_HEADER_TOP_PX =
  ONBOARDING_COMPACT_HEADER_TOP_PX +
  ONBOARDING_TITLE_SUBTITLE_GAP_PX +
  40 +
  ONBOARDING_HEADER_BODY_GAP_PX;
