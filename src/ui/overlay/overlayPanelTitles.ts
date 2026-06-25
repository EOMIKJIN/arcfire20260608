import type { ArcOverlayVisualTheme } from './tacticalOverlayRollout';
import { formatTacticalOverlayTitle, tacticalTitleHeaderSubtitle } from './tacticalOverlayStyles';

/** panel 오버레이 제목·부제 — 행성정보창과 동일 tactical 포맷 */
export function resolveOverlayPanelTitles(
  visualTheme: ArcOverlayVisualTheme,
  title: string,
  subtitle?: string,
): { title: string; subtitle?: string } {
  if (visualTheme !== 'tactical') {
    return { title, subtitle };
  }
  return {
    title: formatTacticalOverlayTitle(title),
    subtitle: tacticalTitleHeaderSubtitle(subtitle),
  };
}
