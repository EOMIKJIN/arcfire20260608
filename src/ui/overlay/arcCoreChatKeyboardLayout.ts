/** 자판 바로 위 채팅 열 — 창이 이미 줄어든 만큼은 빼서 이중 패딩을 막는다. */

const WINDOW_RESIZE_SLACK_PX = 24;
export const ARC_CORE_CHAT_MIN_COLUMN_PX = 220;
/** 입력 글줄이 자판에 반 칸 잠기지 않도록 더하는 여유. */
export const ARC_CORE_CHAT_IME_CLEARANCE_PX = 36;

export function resolveArcCoreChatKeyboardInsetPx(
  fullWindowHeight: number,
  windowHeight: number,
  keyboardHeight: number,
  restingChromePx = 0,
): number {
  if (keyboardHeight <= 0) return 0;
  const kb = Math.round(keyboardHeight);
  const shrunk = Math.max(0, Math.round(fullWindowHeight) - Math.round(windowHeight));
  const keyboardShrink = Math.max(0, shrunk - Math.max(0, Math.round(restingChromePx)));
  const remain = kb - keyboardShrink;
  if (remain <= WINDOW_RESIZE_SLACK_PX) return 0;
  return remain;
}

export function resolveArcCoreChatComposerLiftPx(
  keyboardInset: number,
  hostBottomPx: number,
): number {
  if (keyboardInset <= 0) return 0;
  const overlap = Math.max(0, Math.round(keyboardInset) - Math.max(0, Math.round(hostBottomPx)));
  if (overlap <= 0) return 0;
  return overlap + ARC_CORE_CHAT_IME_CLEARANCE_PX;
}

export function resolveArcCoreChatColumnBottomPadPx(
  keyboardInset: number,
  safeBottomPx: number,
  windowHeight = 0,
): number {
  const raw = keyboardInset > 0 ? keyboardInset : Math.max(0, Math.round(safeBottomPx));
  if (windowHeight <= 0) return raw;
  const maxPad = Math.max(0, Math.round(windowHeight) - ARC_CORE_CHAT_MIN_COLUMN_PX);
  return Math.min(raw, maxPad);
}
