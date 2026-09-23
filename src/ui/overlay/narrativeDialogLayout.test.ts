import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STAGE_BOTTOM_MIN_INSET_PX } from '../../stages/layout';
import { OVERLAY_CENTER_VERTICAL_BIAS_PX } from './overlayPanelLayout';
import {
  NARRATIVE_DIALOG_CENTER_WRAP_BOTTOM_PAD_PX,
  NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX,
  NARRATIVE_DIALOG_LAYOUT,
  NARRATIVE_DIALOG_TOP_WHITE_MARGIN_PX,
  NARRATIVE_DIALOG_UNMEASURED_SHIFT_DOWN_PX,
  resolveNarrativeDialogCharsPerLine,
  resolveNarrativeDialogPortraitBleedPx,
  resolveNarrativeDialogReservedBottomPx,
  resolveNarrativeDialogStageFill,
  resolveNarrativeDialogTextWidthPx,
} from './narrativeDialogLayout';

test('narrative dialog is a vertical 3-layer portrait popup', () => {
  const L = NARRATIVE_DIALOG_LAYOUT;
  assert.equal(L.portraitLayerHeight, 300);
  assert.equal(L.portraitHeight, L.portraitLayerHeight);
  assert.equal(L.height, L.portraitLayerHeight + L.dialogueLayerHeight + L.actionLayerHeight);
  assert.equal(L.height, 482);
  assert.equal(L.hudHeight, L.dialogueLayerHeight + L.actionLayerHeight);
  assert.equal(L.hostHorizontalPadPx, 0);
  assert.equal(L.maxLinesDefault, 3);
});

test('without hatch measure, keep card height and shift the block down 20px', () => {
  const windowHeight = 800;
  const fill = resolveNarrativeDialogStageFill(windowHeight);
  const cardH = NARRATIVE_DIALOG_LAYOUT.height;
  const expectedPinTop =
    OVERLAY_CENTER_VERTICAL_BIAS_PX +
    (windowHeight
      - OVERLAY_CENTER_VERTICAL_BIAS_PX
      - NARRATIVE_DIALOG_CENTER_WRAP_BOTTOM_PAD_PX
      - cardH) / 2;

  assert.equal(fill.hatchMeasured, false);
  assert.equal(fill.pinTopPx, expectedPinTop);
  assert.equal(
    fill.headerBottomPx,
    expectedPinTop + NARRATIVE_DIALOG_UNMEASURED_SHIFT_DOWN_PX + NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX,
  );
  assert.equal(fill.imageHeightPx, cardH);
  assert.equal(fill.topWhiteMarginPx, NARRATIVE_DIALOG_TOP_WHITE_MARGIN_PX);
  assert.equal(
    fill.pinBottomPx,
    fill.headerBottomPx + cardH - NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX,
  );
  assert.equal(fill.reservedBottomPx, STAGE_BOTTOM_MIN_INSET_PX);
  assert.equal(
    fill.bottomBleedPx,
    windowHeight
      - STAGE_BOTTOM_MIN_INSET_PX
      - fill.pinBottomPx
      - NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX
      - NARRATIVE_DIALOG_TOP_WHITE_MARGIN_PX,
  );
});

test('measured hatch still uses the same center-pin card layout as unmeasured (size unify)', () => {
  const windowHeight = 800;
  const cardH = NARRATIVE_DIALOG_LAYOUT.height;
  const unmeasured = resolveNarrativeDialogStageFill(windowHeight);
  const measured = resolveNarrativeDialogStageFill(windowHeight, { hatchBottomY: 168 });
  assert.equal(measured.hatchMeasured, true);
  assert.equal(measured.imageHeightPx, cardH);
  assert.equal(measured.headerBottomPx, unmeasured.headerBottomPx);
  assert.equal(measured.pinBottomPx, unmeasured.pinBottomPx);
  assert.equal(measured.topWhiteMarginPx, unmeasured.topWhiteMarginPx);
  assert.equal(measured.bottomBleedPx, unmeasured.bottomBleedPx);
  assert.equal(measured.reservedBottomPx, unmeasured.reservedBottomPx);
});

test('spacer+topMargin+card+bleed+reserved always sums to windowHeight regardless of offset (no bottom gap)', () => {
  const windowHeight = 800;
  const unmeasured = resolveNarrativeDialogStageFill(windowHeight);
  const unmeasuredTotal =
    unmeasured.headerBottomPx
    + unmeasured.topWhiteMarginPx
    + unmeasured.imageHeightPx
    + unmeasured.bottomBleedPx
    + unmeasured.reservedBottomPx;
  assert.equal(unmeasuredTotal, windowHeight);

  const measured = resolveNarrativeDialogStageFill(windowHeight, { hatchBottomY: 168 });
  const measuredTotal =
    measured.headerBottomPx
    + measured.topWhiteMarginPx
    + measured.imageHeightPx
    + measured.bottomBleedPx
    + measured.reservedBottomPx;
  assert.equal(measuredTotal, windowHeight);
  assert.equal(measuredTotal, unmeasuredTotal);
});

test('reserved bottom uses Stage min inset over smaller safe area', () => {
  assert.equal(resolveNarrativeDialogReservedBottomPx(0), STAGE_BOTTOM_MIN_INSET_PX);
  assert.equal(resolveNarrativeDialogReservedBottomPx(24), STAGE_BOTTOM_MIN_INSET_PX);
  assert.equal(resolveNarrativeDialogReservedBottomPx(80), 80);
});

test('portrait bleed is full card width and never below the 300 slot', () => {
  const L = NARRATIVE_DIALOG_LAYOUT;
  assert.equal(resolveNarrativeDialogPortraitBleedPx(280), L.portraitLayerHeight);
  assert.equal(resolveNarrativeDialogPortraitBleedPx(360), 360);
  assert.equal(
    resolveNarrativeDialogPortraitBleedPx(400, { safeLeft: 20, safeRight: 20 }),
    360,
  );
});

test('text width uses full card width after portrait moved on top', () => {
  const L = NARRATIVE_DIALOG_LAYOUT;
  assert.equal(L.dialogueIndentPx, 12);
  const wide = resolveNarrativeDialogTextWidthPx(360, { hostHorizontalPadPx: 4 });
  const withSafe = resolveNarrativeDialogTextWidthPx(360, {
    hostHorizontalPadPx: 4,
    safeLeft: 20,
    safeRight: 20,
  });
  assert.equal(wide, 360 - 4 * 2 - L.hudHorizontalPadPx * 2 - L.dialogueIndentPx);
  assert.ok(wide - withSafe === 40);
  assert.equal(L.charWidthPx, 12.7);
  assert.equal(L.splitSafetyChars, 1);
  const chars = resolveNarrativeDialogCharsPerLine(360);
  assert.equal(
    chars,
    Math.max(10, Math.floor(resolveNarrativeDialogTextWidthPx(360) / L.charWidthPx) - L.splitSafetyChars),
  );
  assert.ok(chars >= 20);
});
