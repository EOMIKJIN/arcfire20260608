/** 패널형·무역(구매/판매) 카드 세로 — 화면 대비 최소·최대 높이(%) */
export const OVERLAY_PANEL_CARD_MIN_HEIGHT_PCT = '85%' as const;
export const OVERLAY_PANEL_CARD_MAX_HEIGHT_PCT = '96%' as const;

/** @deprecated panel과 동일 — compact+footer 호환 alias */
export const OVERLAY_COMPACT_CARD_MIN_HEIGHT_PCT = OVERLAY_PANEL_CARD_MIN_HEIGHT_PCT;
export const OVERLAY_COMPACT_CARD_MAX_HEIGHT_PCT = OVERLAY_PANEL_CARD_MAX_HEIGHT_PCT;

/**
 * 패널 ScrollView maxHeight — flex 레이아웃 보조(명시 전달 시만).
 * bounded 카드(minHeight%)는 ScrollView flex:1 우선.
 */
export function resolveOverlayPanelScrollMaxHeight(windowHeight: number, reservedPx = 220): number {
  const cap = Math.floor(windowHeight * 0.9 - reservedPx);
  return Math.max(240, Math.min(620, cap));
}

/** 하단 footerDock(취소·확인) 최소 높이 */
export const OVERLAY_FOOTER_DOCK_MIN_HEIGHT = 76;

/** 행성정보 — 헤더와 초상화 이미지 사이 최소 간격 */
export const PLANET_ECONOMY_PANEL_BODY_PADDING_TOP_PX = 0;

/** 행성정보 — 이미지 아래 설명 4줄 고정 높이 (총사령관 1줄 포함) */
export const PLANET_INFO_DESCRIPTION_LINES = 4;
export const PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX = 18;
export const PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX =
  PLANET_INFO_DESCRIPTION_LINES * PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX + 8;

/** 행성정보 패널 — 기본 85% + 설명 블록만큼 아래로 확장 */
export function resolvePlanetEconomyOverlayMinHeight(windowHeight: number): number {
  const base = Math.floor(windowHeight * 0.85);
  return Math.min(
    Math.floor(windowHeight * 0.96) - 8,
    base + PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX,
  );
}

export function resolvePlanetEconomyOverlayMaxHeight(windowHeight: number): number {
  return Math.floor(windowHeight * 0.96);
}

/** scrollMaxHeight reserved — 패널 유형별(헤더·prefix·footerDock 추정) */
export const OVERLAY_PANEL_RESERVE_LIST = 200;
export const OVERLAY_PANEL_RESERVE_SETTINGS = 210;
export const OVERLAY_PANEL_RESERVE_ECONOMY = 280;
export const OVERLAY_PANEL_RESERVE_SHOP = 240;
export const OVERLAY_DEV_DETAIL_FOOTER_RESERVE_PX = 300;

export const OVERLAY_CARD_LAYOUT = {
  width: '100%' as const,
  alignSelf: 'stretch' as const,
  flexShrink: 0,
};

/** 중앙 정렬 팝업 — 화면 정중앙보다 약간 아래(상단 여백) */
export const OVERLAY_CENTER_VERTICAL_BIAS_PX = 36;

/** 행성정보 — 상단 고정·아래로 확장 패널 앵커 */
export const OVERLAY_PANEL_TOP_ANCHOR_PX = 28;
