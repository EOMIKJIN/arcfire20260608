import type { ArcOverlayKind } from './arcOverlayStore';

export const OVERLAY_Z = {
  blocking: 2000,
  narrative: 3000,
  panel: 4000,
  alert: 9999,
} as const;

export const OVERLAY_BACKDROP = {
  phosphor: 'rgba(6, 10, 20, 0.78)',
  narrative: 'rgba(3, 8, 17, 0.55)',
  panel: 'rgba(6, 10, 20, 0.82)',
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
