import { phosphorOverlay } from './content/phosphorOverlayStyles';
import type { ArcOverlayVisualTheme } from './tacticalOverlayRollout';
import { tacticalOverlayCompactStyles } from './tacticalOverlayCompactStyles';

/** compact 카드 본문 스타일 — reward·levelUp·alert·waveResult 공통 */
export function resolveOverlayCompactBodyStyles(theme: ArcOverlayVisualTheme) {
  return theme === 'tactical' ? tacticalOverlayCompactStyles : phosphorOverlay;
}
