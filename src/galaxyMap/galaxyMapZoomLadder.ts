// ============================================================
// 은하 지도 줌 (버튼만 · 핀치 없음)
//
// 사용 단: 축소 1칸 · 0% · 확대 1칸(√S_max×0.72)
// 최대축소(0)·최대확대(4) 는 비활성. persist 없음.
//
// 복구: GALAXY_MAP_ZOOM_ENABLED = false
//       → 버튼 미표시 · 배율 1 · 지금 지도와 동일
// ============================================================

/** 문제 시 false. persist 없음. */
export const GALAXY_MAP_ZOOM_ENABLED = true;

/** 최대축소(0) 비활성 — 기준에서 축소 1칸만 */
export const GALAXY_MAP_ZOOM_STEP_MIN = 1;
/** 최대확대(4) 비활성 — 기준에서 확대 1칸만 */
export const GALAXY_MAP_ZOOM_STEP_MAX = 3;
/** 사용 단 최대확대(step 3) — 기존 √S_max 대비 0.72 (직전 0.8에서 10% 추가) */
export const GALAXY_MAP_ZOOM_IN_MAX_MUL = 0.72;
/** 0% = 지금 지도 */
export const GALAXY_MAP_ZOOM_DEFAULT_STEP = 2;

export const GALAXY_MAP_ZOOM_HIT_RADIUS_MIN_PX = 20;

/** worldmap mapContentSize 와 동일 */
export const GALAXY_MAP_CONTENT_DIM_MIN_PX = 1;
export const GALAXY_MAP_CONTENT_DIM_MAX_PX = 8192;

export function clampGalaxyMapContentDim(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return GALAXY_MAP_CONTENT_DIM_MIN_PX;
  return Math.min(
    GALAXY_MAP_CONTENT_DIM_MAX_PX,
    Math.max(GALAXY_MAP_CONTENT_DIM_MIN_PX, v),
  );
}

export function stepGalaxyMapZoom(step: number, delta: number): number {
  const next = step + delta;
  if (next < GALAXY_MAP_ZOOM_STEP_MIN) return GALAXY_MAP_ZOOM_STEP_MIN;
  if (next > GALAXY_MAP_ZOOM_STEP_MAX) return GALAXY_MAP_ZOOM_STEP_MAX;
  return next;
}

/**
 * 가시 bbox가 뷰포트에 스크롤 없이 들어가는 배율. 이미 들어가면 1.
 */
export function resolveGalaxyMapZoomScaleMin(input: {
  viewportW: number;
  viewportH: number;
  spanX: number;
  spanY: number;
  padPx: number;
}): number {
  const { viewportW, viewportH, padPx } = input;
  const spanX = Math.max(input.spanX, 0.001);
  const spanY = Math.max(input.spanY, 0.001);
  const innerW = viewportW - padPx * 2;
  const innerH = viewportH - padPx * 2;
  const baseW = spanX * viewportW;
  const baseH = spanY * viewportH;
  if (innerW <= 0 || innerH <= 0 || baseW <= 0 || baseH <= 0) return 1;
  const fit = Math.min(innerW / baseW, innerH / baseH);
  if (!Number.isFinite(fit) || fit <= 0) return 1;
  return Math.min(1, fit);
}

export function resolveGalaxyMapZoomScaleMax(scaleMin: number): number {
  if (!Number.isFinite(scaleMin) || scaleMin <= 0) return 1;
  return 1 / scaleMin;
}

/** 사용 단 1..3 → √S_min, 1, √S_max×0.72. 0/4 요청은 1/3으로 클램프. */
export function resolveGalaxyMapZoomScaleAtStep(step: number, scaleMin: number): number {
  const sMin = scaleMin > 0 && Number.isFinite(scaleMin) ? Math.min(1, scaleMin) : 1;
  const sMax = resolveGalaxyMapZoomScaleMax(sMin);
  const clamped = stepGalaxyMapZoom(step, 0);
  if (clamped === 0) return sMin;
  if (clamped === 1) return Math.sqrt(sMin);
  if (clamped === 2) return 1;
  if (clamped === 3) return Math.max(1, Math.sqrt(sMax) * GALAXY_MAP_ZOOM_IN_MAX_MUL);
  return sMax;
}

/**
 * 1x 콘텐츠 좌표의 히트 반경.
 * 화면 손가락 크기(baseHitR)를 유지하려면 scale로 나눈다.
 * (SVG 좌표를 키우면 Android SvgView 비트맵 크래시 — 카메라는 transform만)
 */
export function resolveGalaxyMapNodeHitRadius(
  baseHitR: number,
  scale: number,
  _scaleMax?: number,
): number {
  const s = scale > 0 && Number.isFinite(scale) ? scale : 1;
  const raw = baseHitR / s;
  if (raw < GALAXY_MAP_ZOOM_HIT_RADIUS_MIN_PX / Math.max(s, 1)) {
    return GALAXY_MAP_ZOOM_HIT_RADIUS_MIN_PX / Math.max(s, 1);
  }
  return raw;
}

export function resolveGalaxyMapZoomLetterbox(input: {
  viewportW: number;
  viewportH: number;
  contentW: number;
  contentH: number;
  scale: number;
}): { x: number; y: number } {
  const s = input.scale > 0 && Number.isFinite(input.scale) ? input.scale : 1;
  return {
    x: Math.max(0, (input.viewportW - input.contentW * s) / 2),
    y: Math.max(0, (input.viewportH - input.contentH * s) / 2),
  };
}

export function resolveGalaxyMapZoomMaxScroll(input: {
  viewportW: number;
  viewportH: number;
  contentW: number;
  contentH: number;
  scale: number;
}): { maxSX: number; maxSY: number } {
  const s = input.scale > 0 && Number.isFinite(input.scale) ? input.scale : 1;
  return {
    maxSX: Math.max(0, input.contentW * s - input.viewportW),
    maxSY: Math.max(0, input.contentH * s - input.viewportH),
  };
}

/** 뷰포트 탭 + 스크롤 → 1x SVG 콘텐츠 좌표 */
export function mapViewportTapToContent(input: {
  viewportX: number;
  viewportY: number;
  scrollX: number;
  scrollY: number;
  scale: number;
  letterX: number;
  letterY: number;
}): { x: number; y: number } {
  const s = input.scale > 0 && Number.isFinite(input.scale) ? input.scale : 1;
  return {
    x: (input.viewportX + input.scrollX - input.letterX) / s,
    y: (input.viewportY + input.scrollY - input.letterY) / s,
  };
}

export function resolveGalaxyMapZoomScrollTarget(input: {
  contentX: number;
  contentY: number;
  viewportW: number;
  viewportH: number;
  contentW: number;
  contentH: number;
  scale: number;
}): { x: number; y: number } {
  const s = input.scale > 0 && Number.isFinite(input.scale) ? input.scale : 1;
  const letter = resolveGalaxyMapZoomLetterbox(input);
  const max = resolveGalaxyMapZoomMaxScroll(input);
  return {
    x: Math.max(0, Math.min(input.contentX * s + letter.x - input.viewportW / 2, max.maxSX)),
    y: Math.max(0, Math.min(input.contentY * s + letter.y - input.viewportH / 2, max.maxSY)),
  };
}
