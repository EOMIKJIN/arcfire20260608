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

/** panel 목록 카드 간격 — `planetDevelopmentOverlayStyles.listItem.marginBottom` 과 동일 */
export const OVERLAY_PANEL_LIST_ITEM_GAP_PX = 8;

/** panel bodyPanel 상단 — 헤더↔첫 콘텐츠 = 목록 카드 간격과 동일 */
export const OVERLAY_PANEL_BODY_PADDING_TOP_PX = OVERLAY_PANEL_LIST_ITEM_GAP_PX;

/** @deprecated `OVERLAY_PANEL_BODY_PADDING_TOP_PX` */
export const PLANET_ECONOMY_PANEL_BODY_PADDING_TOP_PX = OVERLAY_PANEL_BODY_PADDING_TOP_PX;

/** panel Host — 상단 고정·아래로 확장 (`getOverlayChrome().hostAnchor === 'top'`) */
export const OVERLAY_PANEL_TOP_ANCHOR_PX = 28;

/** 행성정보 bleed — 이미지 아래 설명 4줄 고정 높이 (총사령관 1줄 포함) */
export const PLANET_INFO_DESCRIPTION_LINES = 4;
export const PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX = 18;
export const PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX =
  PLANET_INFO_DESCRIPTION_LINES * PLANET_INFO_DESCRIPTION_LINE_HEIGHT_PX + 8;

/** 행성개발 목록 카드 — summary 3줄 · descender 여유(+2px/줄) */
export const PLANET_DEV_LIST_DESCRIPTION_LINES = 3;
export const PLANET_DEV_LIST_DESCRIPTION_LINE_HEIGHT_PX = 18;
/** Android mono 한글 descender — 줄당 +2px */
export const PLANET_DEV_LIST_DESCRIPTION_LINE_SLACK_PX = 2;
export const PLANET_DEV_LIST_DESCRIPTION_BLOCK_HEIGHT_PX =
  PLANET_DEV_LIST_DESCRIPTION_LINES * (PLANET_DEV_LIST_DESCRIPTION_LINE_HEIGHT_PX
    + PLANET_DEV_LIST_DESCRIPTION_LINE_SLACK_PX);
/** 3줄 summary ↔ 게이지 사이 간격 */
export const PLANET_DEV_LIST_SUMMARY_GAUGE_GAP_PX = 8;
/** @deprecated `PLANET_DEV_LIST_SUMMARY_GAUGE_GAP_PX` */
export const PLANET_DEV_LIST_SUMMARY_BLANK_LINE_PX = PLANET_DEV_LIST_SUMMARY_GAUGE_GAP_PX;
/** @deprecated 설명+공백 고정 블록 — gauge gap은 슬롯 marginTop */
export const PLANET_DEV_LIST_SUMMARY_BLOCK_HEIGHT_PX = PLANET_DEV_LIST_DESCRIPTION_BLOCK_HEIGHT_PX;
/** 디지털 게이지 행 높이(세그먼트+%) */
export const PLANET_DEV_LIST_GAUGE_ROW_HEIGHT_PX = 20;
export const PLANET_DEV_LIST_GAUGE_LABEL_LINE_HEIGHT_PX = 18;
export const PLANET_DEV_LIST_GAUGE_LABEL_MAX_LINES = 2;
/** 진행 중(라벨 2줄+게이지) 최대 높이 — idle minHeight 용 아님 */
export const PLANET_DEV_LIST_GAUGE_PROGRESS_MAX_HEIGHT_PX =
  PLANET_DEV_LIST_GAUGE_LABEL_LINE_HEIGHT_PX * PLANET_DEV_LIST_GAUGE_LABEL_MAX_LINES
  + 4
  + PLANET_DEV_LIST_GAUGE_ROW_HEIGHT_PX;
/** @deprecated `PLANET_DEV_LIST_GAUGE_PROGRESS_MAX_HEIGHT_PX` */
export const PLANET_DEV_LIST_GAUGE_RESERVE_HEIGHT_PX = PLANET_DEV_LIST_GAUGE_PROGRESS_MAX_HEIGHT_PX;

/**
 * 범용 panel 카드 minHeight(px) — 85% + 설명 블록 보정(행성정보 bleed와 동일 창 높이).
 * `layout="panel"` 은 ArcOverlayCard 기본값으로 자동 적용.
 */
export function resolveOverlayPanelMinHeight(windowHeight: number): number {
  const base = Math.floor(windowHeight * 0.85);
  return Math.min(
    Math.floor(windowHeight * 0.96) - 8,
    base + PLANET_INFO_DESCRIPTION_BLOCK_HEIGHT_PX,
  );
}

/** 범용 panel 카드 maxHeight(px) — 화면 96% */
export function resolveOverlayPanelMaxHeight(windowHeight: number): number {
  return Math.floor(windowHeight * 0.96);
}

/** @deprecated `resolveOverlayPanelMinHeight` */
export function resolvePlanetEconomyOverlayMinHeight(windowHeight: number): number {
  return resolveOverlayPanelMinHeight(windowHeight);
}

/** @deprecated `resolveOverlayPanelMaxHeight` */
export function resolvePlanetEconomyOverlayMaxHeight(windowHeight: number): number {
  return resolveOverlayPanelMaxHeight(windowHeight);
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

/** 중앙 정렬 팝업(compact) — 화면 정중앙보다 약간 아래 */
export const OVERLAY_CENTER_VERTICAL_BIAS_PX = 36;
