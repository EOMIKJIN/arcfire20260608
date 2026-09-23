/**
 * 범용 초단 전환 시퀀스 — 오버레이 오픈/클로징.
 * 틱/루프 없음. 값은 기존 레이아웃 상수와 분리(신규 토큰만).
 *
 * 오픈 2박: 떠오르며 드러남 → 안착
 * 클로즈 2박: 살짝 가라앉음 → 소거
 */

export const OVERLAY_SHORT_TRANSITION = {
  openRevealMs: 80,
  openSettleMs: 100,
  closeSinkMs: 70,
  closeFadeMs: 80,
  startOpacity: 0,
  midOpenOpacity: 0.82,
  midCloseOpacity: 0.42,
  startScale: 0.985,
  startTranslateY: 10,
  midOpenTranslateY: 4,
  midCloseTranslateY: 6,
  endCloseTranslateY: 12,
} as const;

export const OVERLAY_SHORT_TRANSITION_OPEN_MS =
  OVERLAY_SHORT_TRANSITION.openRevealMs + OVERLAY_SHORT_TRANSITION.openSettleMs;

export const OVERLAY_SHORT_TRANSITION_CLOSE_MS =
  OVERLAY_SHORT_TRANSITION.closeSinkMs + OVERLAY_SHORT_TRANSITION.closeFadeMs;

export function reduceOverlayShortHold<T>(
  held: T | null,
  live: T | null,
  blocked: boolean,
): T | null {
  if (blocked) return null;
  if (live) return live;
  return held;
}

export function reduceOverlayShortHoldExited<T>(live: T | null): T | null {
  return live;
}
