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
