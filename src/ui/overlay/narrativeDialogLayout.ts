import { FONTS, SPACING } from '../../utils/theme';
import { STAGE_BOTTOM_MIN_INSET_PX } from '../../stages/layout';
import { OVERLAY_CENTER_VERTICAL_BIAS_PX } from './overlayPanelLayout';

/**
 * 인게임·내러티브 대화창 — intro / ArcOverlayHost 공통 디자인 치수
 * (정본 · 2026-09-06 세로형 팝업: 얼굴 → 대사 → 버튼 3단 레이어).
 *
 * ## 기본 UI 계약
 * - **컴포넌트**: `NarrativeDialogRow` 단일 — 커스텀 Modal·별도 TextBox 금지
 * - **레이아웃**: 세로 3단 — `portraitLayer` · `dialogueLayer` · `actionLayer`
 * - **초상**: 문서흐름 슬롯 300 유지(대사 핀). 이미지는 카드 전폭 정사각 · 위로 overflow
 * - **원본 PNG**: 240×240 · `contain` (전면 cover+HUD 오버레이 폐기)
 * - **대사**: 중단 — 화자명 `[ 이름 ]` + 본문(최대 3줄) · 화자명·본문 왼쪽 1em 동일 · 좌측 정렬
 * - **버튼**: 하단 우측 `[ 다음 ]` / `[ 확인 ]` — 본문 완료 후 활성
 * - **허브·시설**: 고정 높이 3단 카드 · **중앙 핀 단일 규격**(시설 hatch 실측과 무관 · 하단 흰색 bleed 동일)
 * - **분할**: `resolveNarrativeDialogCharsPerLine` + 시각 줄 예산.
 *   작성 `\n` 존중. 한 줄이 폭을 넘으면 엔진이 페이지를 나누고 시각 `\n`을 고정한다.
 * - **팝업 위치**: 화면 **좌우·세로 중앙 핀** (`anchor: 'center'`) · dim 없음
 * - **오픈/클로징**: 전환 연출 보류. 화면 셸(메뉴·데이터) 완료 후 대화 present (`useUiScreenShell`)
 *
 * 규칙: `.cursor/rules/arcfire-ingame-dialog-ui-default.mdc`
 */

/** ArcOverlayHost `centerWrap.paddingBottom` 과 동일 — 핀 Y 계산 전용(기존값 읽기) */
export const NARRATIVE_DIALOG_CENTER_WRAP_BOTTOM_PAD_PX = SPACING.xs;
/** 빗살무늬 헤더 미실측 시 — 크기 유지, 전체만 아래로 */
export const NARRATIVE_DIALOG_UNMEASURED_SHIFT_DOWN_PX = 20;

const LINE_HEIGHT = 26;
const LABEL_LINE_HEIGHT = 18;
const MAX_LINES_DEFAULT = 3;
const TEXT_BLOCK_TAIL_PAD_PX = 6;
const DIALOGUE_PAD_TOP_PX = SPACING.md;
const DIALOGUE_PAD_BOTTOM_PX = SPACING.sm;
const LABEL_MARGIN_BOTTOM_PX = SPACING.xs;
const PORTRAIT_LAYER_HEIGHT = 300;
const ACTION_LAYER_HEIGHT = 56;

function resolveDialogueLayerHeightPx(): number {
  const textBlock = MAX_LINES_DEFAULT * LINE_HEIGHT + TEXT_BLOCK_TAIL_PAD_PX;
  return (
    DIALOGUE_PAD_TOP_PX
    + LABEL_LINE_HEIGHT
    + LABEL_MARGIN_BOTTOM_PX
    + textBlock
    + DIALOGUE_PAD_BOTTOM_PX
  );
}

const DIALOGUE_LAYER_HEIGHT = resolveDialogueLayerHeightPx();
const CARD_HEIGHT = PORTRAIT_LAYER_HEIGHT + DIALOGUE_LAYER_HEIGHT + ACTION_LAYER_HEIGHT;

export const NARRATIVE_DIALOG_LAYOUT = {
  /** 상단 얼굴 레이어 높이 (세로형 팝업 기준) */
  portraitLayerHeight: PORTRAIT_LAYER_HEIGHT,
  /** @deprecated 호환 — portraitLayerHeight 와 동일 */
  portraitHeight: PORTRAIT_LAYER_HEIGHT,
  /** 중단 대사 레이어(화자+본문) 높이 */
  dialogueLayerHeight: DIALOGUE_LAYER_HEIGHT,
  /** 하단 버튼 레이어 높이 */
  actionLayerHeight: ACTION_LAYER_HEIGHT,
  /** @deprecated 호환 — dialogue+action 합 (구 hud 오버레이) */
  hudHeight: DIALOGUE_LAYER_HEIGHT + ACTION_LAYER_HEIGHT,
  /** 팝업 카드 전체 높이 = 얼굴+대사+버튼 */
  height: CARD_HEIGHT,
  /** 문서흐름 슬롯 너비 토큰(300). 실제 초상 정사각은 `resolveNarrativeDialogPortraitBleedPx` */
  portraitWidth: PORTRAIT_LAYER_HEIGHT,
  fontSizeMd: FONTS.size.md,
  /** soft-wrap 페이지 추정. RN보다 한 글자 보수적으로 접어 박스 초과를 막는다 */
  charWidthPx: 12.7,
  /** 초상 좌우 여백 없음. safe area만 Host가 더함 */
  hostHorizontalPadPx: 0,
  /** 대사·버튼 레이어 내부 좌우 */
  hudHorizontalPadPx: SPACING.sm,
  /** 화자명·본문 공통 왼쪽 1em (이름 폰트 sm=12) */
  dialogueIndentPx: FONTS.size.sm,
  /** 카드 borderWidth=0 과 동기 — split 너비에서 차감 */
  rowBorderPx: 0,
  lineHeight: LINE_HEIGHT,
  labelLineHeight: LABEL_LINE_HEIGHT,
  textBlockTailPadPx: TEXT_BLOCK_TAIL_PAD_PX,
  dialoguePadTopPx: DIALOGUE_PAD_TOP_PX,
  dialoguePadBottomPx: DIALOGUE_PAD_BOTTOM_PX,
  labelMarginBottomPx: LABEL_MARGIN_BOTTOM_PX,
  maxLinesDefault: MAX_LINES_DEFAULT,
  /** 화자명·본문 — 좌측 정렬 */
  textAlign: 'left' as const,
  /** IngameDialogHost · ArcOverlayHost narrative 앵커 */
  popupAnchor: 'center' as const,
  splitSafetyChars: 1,
  typewriterSpeedMsDefault: 22,
  typewriterSpeedScale: 0.52,
  typewriterSpeedMsMin: 10,
  typewriterSpeedMsMax: 44,
  nextButtonRevealDelayMs: 320,
  /** 초상·화자명·카드가 열린 뒤 타이핑 rAF 시작까지 */
  typewriterStartDelayMs: 500,
} as const;

export type NarrativeDialogWidthInsets = {
  safeLeft?: number;
  safeRight?: number;
  hostHorizontalPadPx?: number;
};

export function narrativeDialogTextBlockHeight(maxLines: number): number {
  const safe = Math.max(1, maxLines | 0);
  const { lineHeight, textBlockTailPadPx } = NARRATIVE_DIALOG_LAYOUT;
  return safe * lineHeight + textBlockTailPadPx;
}

export function resolveIngameDialogLineBudget(): number {
  return NARRATIVE_DIALOG_LAYOUT.maxLinesDefault;
}

/** 초상 정사각 한 변(px) — 카드 전폭. 슬롯 300보다 크면 위로만 확장 */
export function resolveNarrativeDialogPortraitBleedPx(
  windowWidth: number,
  insets: NarrativeDialogWidthInsets = {},
): number {
  const L = NARRATIVE_DIALOG_LAYOUT;
  const safeLeft = insets.safeLeft ?? 0;
  const safeRight = insets.safeRight ?? 0;
  const hostPad = insets.hostHorizontalPadPx ?? L.hostHorizontalPadPx;
  const cardWidth = Math.floor(
    windowWidth
      - safeLeft
      - safeRight
      - hostPad * 2
      - L.rowBorderPx * 2,
  );
  return Math.max(L.portraitLayerHeight, cardWidth);
}

/** 대사 레이어 본문 가용 너비(px) — 얼굴 레이어와 가로 분리 */
export function resolveNarrativeDialogTextWidthPx(
  windowWidth: number,
  insets: NarrativeDialogWidthInsets = {},
): number {
  const L = NARRATIVE_DIALOG_LAYOUT;
  const safeLeft = insets.safeLeft ?? 0;
  const safeRight = insets.safeRight ?? 0;
  const hostPad = insets.hostHorizontalPadPx ?? L.hostHorizontalPadPx;
  return Math.max(
    120,
    windowWidth
      - safeLeft
      - safeRight
      - hostPad * 2
      - L.hudHorizontalPadPx * 2
      - L.dialogueIndentPx
      - L.rowBorderPx * 2,
  );
}

export function resolveNarrativeDialogCharsPerLine(
  windowWidth: number,
  insets: NarrativeDialogWidthInsets = {},
): number {
  const L = NARRATIVE_DIALOG_LAYOUT;
  const textWidth = resolveNarrativeDialogTextWidthPx(windowWidth, insets);
  const physicalMax = Math.floor(textWidth / L.charWidthPx);
  return Math.max(10, physicalMax - L.splitSafetyChars);
}

export function resolveNarrativeTypewriterSpeedMs(raw?: number | null): number {
  const L = NARRATIVE_DIALOG_LAYOUT;
  const base = raw ?? L.typewriterSpeedMsDefault;
  const scaled = Math.round(base * L.typewriterSpeedScale);
  return Math.min(L.typewriterSpeedMsMax, Math.max(L.typewriterSpeedMsMin, scaled));
}

export function resolveNarrativeDialogReservedBottomPx(safeBottomPx = 0): number {
  return Math.max(STAGE_BOTTOM_MIN_INSET_PX, Math.max(0, safeBottomPx));
}

export const NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX = 30;

export const NARRATIVE_DIALOG_TOP_WHITE_MARGIN_PX = 10;

/** 현재 중앙 핀 상단 Y — Host centerWrap(bias 36 + 하단 xs)과 동일 */
export function resolveNarrativeDialogPinTopPx(windowHeight: number): number {
  const pinHeight = NARRATIVE_DIALOG_LAYOUT.height;
  const topBias = OVERLAY_CENTER_VERTICAL_BIAS_PX;
  const bottomBias = NARRATIVE_DIALOG_CENTER_WRAP_BOTTOM_PAD_PX;
  return topBias + (windowHeight - topBias - bottomBias - pinHeight) / 2;
}

export type NarrativeDialogStageFillMetrics = {
  headerBottomPx: number;
  pinTopPx: number;
  pinHeight: number;
  pinBottomPx: number;
  /** 고정 높이 3단 카드 */
  imageHeightPx: number;
  topWhiteMarginPx: number;
  bottomBleedPx: number;
  reservedBottomPx: number;
  hatchMeasured: boolean;
};

export type NarrativeDialogStageFillOptions = {
  hatchBottomY?: number | null;
  safeBottomPx?: number;
};

/**
 * 3단 팝업 카드는 고정 높이·중앙 핀 단일 규격.
 * 시설 빗살 헤더 실측 여부와 무관하게 동일 위치·동일 하단 흰색(bleed) —
 * 선술집 주인장/종업원 vs 허브 일반 인게임 대사창 사이즈 불일치 방지.
 */
export function resolveNarrativeDialogStageFill(
  windowHeight: number,
  options: NarrativeDialogStageFillOptions = {},
): NarrativeDialogStageFillMetrics {
  const pinHeight = NARRATIVE_DIALOG_LAYOUT.height;
  const pinTopPx = resolveNarrativeDialogPinTopPx(windowHeight);
  const hatchMeasured = options.hatchBottomY != null && options.hatchBottomY > 0;
  const reservedBottomPx = resolveNarrativeDialogReservedBottomPx(options.safeBottomPx ?? 0);
  const bleedLimitY = windowHeight - reservedBottomPx;
  const offset = NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX;
  const topWhiteMarginPx = NARRATIVE_DIALOG_TOP_WHITE_MARGIN_PX;
  const imageHeightPx = pinHeight;

  const headerBottomPx = pinTopPx + NARRATIVE_DIALOG_UNMEASURED_SHIFT_DOWN_PX;
  const shiftedBottomPx = headerBottomPx + imageHeightPx;
  return {
    headerBottomPx: headerBottomPx + offset,
    pinTopPx,
    pinHeight,
    pinBottomPx: shiftedBottomPx,
    imageHeightPx,
    topWhiteMarginPx,
    bottomBleedPx: Math.max(0, bleedLimitY - shiftedBottomPx - offset - topWhiteMarginPx),
    reservedBottomPx,
    hatchMeasured,
  };
}
