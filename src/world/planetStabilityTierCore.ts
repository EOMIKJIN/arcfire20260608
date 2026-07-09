// ============================================================
// 행성 안정도 tier — 순수 함수 (RN·store 무의존)
// ============================================================

import type { PlanetWealthDisparityDetail } from '../store/planetCoreMetricTypes';

export const PLANET_STABILITY_TIER_ORDER = ['stable', 'unrest', 'danger', 'rebellion'] as const;

export type PlanetStabilityTier = (typeof PLANET_STABILITY_TIER_ORDER)[number];

export type PlanetStabilityRebellionPhase = PlanetWealthDisparityDetail['rebellionPhase'];

export type PlanetStabilityTierVisual = {
  tier: PlanetStabilityTier;
  labelKey: string;
  accent: string;
  accentDim: string;
  border: string;
};

export const PLANET_STABILITY_TIER_VISUALS: Record<PlanetStabilityTier, PlanetStabilityTierVisual> = {
  stable: {
    tier: 'stable',
    labelKey: 'planetStability.tier.stable',
    accent: '#3DDC84',
    accentDim: 'rgba(61, 220, 132, 0.28)',
    border: '#6EE7A8',
  },
  unrest: {
    tier: 'unrest',
    labelKey: 'planetStability.tier.unrest',
    accent: '#F5C842',
    accentDim: 'rgba(245, 200, 66, 0.28)',
    border: '#FFE08A',
  },
  danger: {
    tier: 'danger',
    labelKey: 'planetStability.tier.danger',
    accent: '#FF8C42',
    accentDim: 'rgba(255, 140, 66, 0.28)',
    border: '#FFB380',
  },
  rebellion: {
    tier: 'rebellion',
    labelKey: 'planetStability.tier.rebellion',
    accent: '#FF3D5A',
    accentDim: 'rgba(255, 61, 90, 0.32)',
    border: '#FF7A8F',
  },
};

/** 비활성 tier — 90% 투명(불투명도 10%) */
export const PLANET_STABILITY_TIER_INACTIVE_OPACITY = 0.1;

export function resolvePlanetStabilityTierColorOpacity(isActive: boolean): number {
  return isActive ? 1 : PLANET_STABILITY_TIER_INACTIVE_OPACITY;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.replace('#', '').trim();
  if (raw.length !== 6) return null;
  const n = Number.parseInt(raw, 16);
  if (!Number.isFinite(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function resolvePlanetStabilityTierColor(
  hex: string,
  isActive: boolean,
): string {
  const rgb = hexToRgb(hex);
  const opacity = resolvePlanetStabilityTierColorOpacity(isActive);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

const WDI_UNREST_MIN = 35;
const WDI_DANGER_MIN = 70;

export function clampPlanetWdi(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function resolvePlanetStabilityTierFromWdi(
  wdi: number,
  rebellionPhase: PlanetStabilityRebellionPhase = 'none',
): PlanetStabilityTier {
  if (rebellionPhase === 'overthrow') return 'rebellion';
  const w = clampPlanetWdi(wdi);
  if (w >= WDI_DANGER_MIN) return 'danger';
  if (w >= WDI_UNREST_MIN) return 'unrest';
  return 'stable';
}

export function resolvePlanetStabilityTierIndex(tier: PlanetStabilityTier): number {
  return PLANET_STABILITY_TIER_ORDER.indexOf(tier);
}

export function resolvePlanetStabilityTierFillPct(wdi: number, tier: PlanetStabilityTier): number {
  const w = clampPlanetWdi(wdi);
  switch (tier) {
    case 'stable':
      return Math.min(100, Math.round((w / WDI_UNREST_MIN) * 100));
    case 'unrest':
      return Math.min(100, Math.round(((w - WDI_UNREST_MIN) / (WDI_DANGER_MIN - WDI_UNREST_MIN)) * 100));
    case 'danger':
      return Math.min(100, Math.round(((w - WDI_DANGER_MIN) / (100 - WDI_DANGER_MIN)) * 100));
    case 'rebellion':
      return 100;
    default:
      return 0;
  }
}
