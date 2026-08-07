import type { ArcOverlayKind } from './arcOverlayStore';
import { OVERLAY_TOKENS } from '../../utils/theme';
import { resolveArcOverlayVisualTheme } from './tacticalOverlayRollout';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';

export const OVERLAY_Z = {
  blocking: 2000,
  narrative: 3000,
  panel: 4000,
  alert: 9999,
} as const;

/** ArcOverlayHost 전체 딤 — OVERLAY_TOKENS.backdropColor 단일 소스 */
export const OVERLAY_BACKDROP = {
  phosphor: OVERLAY_TOKENS.backdropColor,
  /** 인게임·narrative 대사 — dim 없음 */
  narrative: 'transparent',
  panel: OVERLAY_TOKENS.backdropColor,
} as const;

export type OverlayCardVariant = 'phosphor' | 'panel' | 'narrative';

/** Host 세로 정렬 — panel=상단 앵커 · compact=중앙 bias (kind별 하드코딩 금지, 본 테이블만) */
export type OverlayHostAnchor = 'top' | 'center';

function resolveOverlayBackdrop(kind: ArcOverlayKind): string {
  /** 인게임 대사(IngameDialogHost 등) — 하단 소형 창, 뒤 투명도 없음 */
  if (kind === 'narrative') {
    return resolveArcOverlayVisualTheme(kind) === 'tactical'
      ? TACTICAL_OVERLAY.narrativeBackdrop
      : OVERLAY_BACKDROP.narrative;
  }
  if (resolveArcOverlayVisualTheme(kind) !== 'tactical') {
    return OVERLAY_BACKDROP.panel;
  }
  return TACTICAL_OVERLAY.panelBackdrop;
}

export function getOverlayChrome(kind: ArcOverlayKind): {
  zIndex: number;
  backdrop: string;
  cardVariant: OverlayCardVariant;
  hostAnchor: OverlayHostAnchor;
} {
  switch (kind) {
    case 'settings':
    case 'bmShop':
    case 'planetEconomyInfo':
    case 'planetDevelopment':
    case 'tradeQuantity':
    case 'nearbyPresenceInfo':
    case 'relicLore':
      return {
        zIndex: OVERLAY_Z.panel,
        backdrop: resolveOverlayBackdrop(kind),
        cardVariant: 'panel',
        hostAnchor: 'top',
      };
    case 'levelUp':
    case 'reward':
    case 'waveResult':
      return {
        zIndex: OVERLAY_Z.panel,
        backdrop: resolveOverlayBackdrop(kind),
        cardVariant: 'phosphor',
        hostAnchor: 'center',
      };
    case 'narrative':
      return {
        zIndex: OVERLAY_Z.narrative,
        backdrop: resolveOverlayBackdrop(kind),
        cardVariant: 'narrative',
        hostAnchor: 'center',
      };
    case 'blocking':
      return {
        zIndex: OVERLAY_Z.blocking,
        backdrop: resolveOverlayBackdrop(kind),
        cardVariant: 'phosphor',
        hostAnchor: 'center',
      };
    case 'alert':
    default:
      return {
        zIndex: OVERLAY_Z.alert,
        backdrop: resolveOverlayBackdrop(kind),
        cardVariant: 'phosphor',
        hostAnchor: 'center',
      };
  }
}
