// 은하 지도 성계 드롭다운 — 첫 줄 착륙|닫기 히트 (오버레이 금지 · 균등 · 갭)

export const MENU_WIDTH = 124;
export const MENU_ITEM_HEIGHT = 46;
/** 첫 줄 착륙|닫기 사이 데드존 — 서로 침범 금지 */
export const MENU_FIRST_ROW_HIT_GAP = 2;
/** 첫 줄 균등 분할 (124 − 2) / 2 */
export const MENU_FIRST_ROW_HALF = (MENU_WIDTH - MENU_FIRST_ROW_HIT_GAP) / 2;

export type GalaxyMapMenuTapResult =
  | { kind: 'close' }
  | { kind: 'item'; index: number };

export function isGalaxyMapMenuNavHit(localX: number, localY: number): boolean {
  return localX >= 0 && localX <= MENU_FIRST_ROW_HALF && localY >= 0 && localY <= MENU_ITEM_HEIGHT;
}

/** 맵 Gesture.Tap — 첫 줄 오른쪽 절반 닫기 */
export function isGalaxyMapMenuCloseHit(localX: number, localY: number): boolean {
  const left = MENU_FIRST_ROW_HALF + MENU_FIRST_ROW_HIT_GAP;
  return (
    localX >= left
    && localX <= MENU_WIDTH
    && localY >= 0
    && localY <= MENU_ITEM_HEIGHT
  );
}

/** 첫 줄 오른쪽 = 닫기, 왼쪽 = 착륙/이동, 가운데 갭은 무시 */
export function resolveGalaxyMapMenuTap(
  localX: number,
  localY: number,
  itemCount: number,
): GalaxyMapMenuTapResult | null {
  const height = itemCount * MENU_ITEM_HEIGHT;
  if (localX < 0 || localX > MENU_WIDTH || localY < 0 || localY > height) return null;
  const index = Math.floor(localY / MENU_ITEM_HEIGHT);
  if (index < 0 || index >= itemCount) return null;
  if (index === 0) {
    if (isGalaxyMapMenuCloseHit(localX, localY)) return { kind: 'close' };
    if (isGalaxyMapMenuNavHit(localX, localY)) return { kind: 'item', index: 0 };
    return null;
  }
  return { kind: 'item', index };
}
