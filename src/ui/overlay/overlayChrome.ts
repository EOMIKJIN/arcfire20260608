import type { ArcOverlayKind } from './arcOverlayStore';
import { OVERLAY_TOKENS } from '../../utils/theme';

export const OVERLAY_Z = {
  blocking: 2000,
  narrative: 3000,
  panel: 4000,
  alert: 9999,
} as const;

/** ArcOverlayHost 전체 딤 — OVERLAY_TOKENS.backdropColor 단일 소스 */
export const OVERLAY_BACKDROP = {
  phosphor: OVERLAY_TOKENS.backdropColor,
  narrative: OVERLAY_TOKENS.backdropColor,
  panel: OVERLAY_TOKENS.backdropColor,
} as const;

export type OverlayCardVariant = 'phosphor' | 'panel' | 'narrative';

export function getOverlayChrome(kind: ArcOverlayKind): {
  zIndex: number;
  backdrop: string;
  cardVariant: OverlayCardVariant;
} {
  switch (kind) {
    case 'levelUp':
    case 'reward':
    case 'waveResult':
    case 'settings':
    case 'bmShop':
      return {
        zIndex: OVERLAY_Z.panel,
        backdrop: OVERLAY_BACKDROP.panel,
        cardVariant: 'panel',
      };
    case 'narrative':
      return {
        zIndex: OVERLAY_Z.narrative,
        backdrop: OVERLAY_BACKDROP.narrative,
        cardVariant: 'narrative',
      };
    case 'blocking':
      return {
        zIndex: OVERLAY_Z.blocking,
        backdrop: OVERLAY_BACKDROP.phosphor,
        cardVariant: 'phosphor',
      };
    case 'alert':
    default:
      return {
        zIndex: OVERLAY_Z.alert,
        backdrop: OVERLAY_BACKDROP.phosphor,
        cardVariant: 'phosphor',
      };
  }
}
