import { FONTS, SPACING } from '../../utils/theme';

/**
 * 인게임·내러티브 대화창 — intro / ArcOverlayHost 공통 디자인 치수 (정본 · 2026-06-18).
 *
 * ## 기본 UI 계약 (추가 구현 시 반드시 준수)
 * - **컴포넌트**: `NarrativeDialogRow` 단일 — 커스텀 Modal·별도 TextBox 금지
 * - **레이아웃**: 가로 100% · 고정 높이 `height` · 초상 `portraitWidth` + hud `flex:1`
 * - **본문**: 최대 `maxLinesDefault` 줄 · **좌측 정렬** · 초과는 `splitNarrativeDialogSegments` + `[ 다음 ]`
 * - **분할**: `resolveNarrativeDialogCharsPerLine` — hud 물리 너비 기준, 임의 글자 cap 금지
 * - **초상**: `resolveIngameDialogPortraitSource` — speakerNpcCaptainId → CSV portraitImageAssetKey
 * - **팝업 위치**: 화면 **좌우·세로 중앙** (`anchor: 'center'`) · dim 없음
 * - **오버레이**: `hostHorizontalPadPx` 와 split insets 동기
 * - **진행**: `[ 다음 ]` / `[ 확인 ]` hud 하단 우측 — 스크롤·가변 높이 금지
 *
 * 규칙: `.cursor/rules/arcfire-ingame-dialog-ui-default.mdc`
 */
export const NARRATIVE_DIALOG_LAYOUT = {
  /** 가로 100% — portrait + hud flex */
  height: 204,
  /** 초상 카드 (정본) */
  portraitWidth: 145,
  fontSizeMd: FONTS.size.md,
  /** soft-wrap 분할 — mono md(14) 한글 ~0.91em (줄 끝 우측 공백 최소화) */
  charWidthPx: 12.7,
  /** ArcOverlayHost · intro ingame 슬롯 좌우 */
  hostHorizontalPadPx: SPACING.xs,
  /** NarrativeDialogRow hud 내부 좌우 */
  hudHorizontalPadPx: SPACING.sm,
  rowBorderPx: 1,
  lineHeight: 26,
  labelLineHeight: 18,
  textBlockTailPadPx: 6,
  maxLinesDefault: 3,
  /** hud 본문·화자명 — 좌측 정렬 (팝업 위치와 별개) */
  textAlign: 'left' as const,
  /** IngameDialogHost · ArcOverlayHost narrative 앵커 */
  popupAnchor: 'center' as const,
  /** 물리 한도까지 채움 — 보수적 cap 없음 */
  splitSafetyChars: 0,
  /** CSV typewriterSpeedMs 기본 · scale 적용 후 ms/char */
  typewriterSpeedMsDefault: 22,
  typewriterSpeedScale: 0.52,
  typewriterSpeedMsMin: 10,
  typewriterSpeedMsMax: 44,
  /** 타이핑 완료 → [ 다음 ] 등장 전 짧은 여백(ms) */
  nextButtonRevealDelayMs: 320,
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

/** hud 본문 텍스트가 실제로 그려지는 너비(px) — ArcOverlayHost 패딩과 동일 식 */
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
      - L.portraitWidth
      - L.hudHorizontalPadPx * 2
      - L.rowBorderPx * 2,
  );
}

/** soft-wrap — 본문 가용 너비를 한 줄에 꽉 채움 (임의 cap 없음) */
export function resolveNarrativeDialogCharsPerLine(
  windowWidth: number,
  insets: NarrativeDialogWidthInsets = {},
): number {
  const L = NARRATIVE_DIALOG_LAYOUT;
  const textWidth = resolveNarrativeDialogTextWidthPx(windowWidth, insets);
  const physicalMax = Math.floor(textWidth / L.charWidthPx);
  return Math.max(10, physicalMax - L.splitSafetyChars);
}

/** scene CSV ms/char → 인게임 체감 속도 (2026-06-27: 더 빠르고 rAF 기반 출력) */
export function resolveNarrativeTypewriterSpeedMs(raw?: number | null): number {
  const L = NARRATIVE_DIALOG_LAYOUT;
  const base = raw ?? L.typewriterSpeedMsDefault;
  const scaled = Math.round(base * L.typewriterSpeedScale);
  return Math.min(L.typewriterSpeedMsMax, Math.max(L.typewriterSpeedMsMin, scaled));
}
