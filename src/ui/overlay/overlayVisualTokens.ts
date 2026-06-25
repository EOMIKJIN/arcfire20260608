import { OVERLAY_TOKENS } from '../../utils/theme';
import type { ArcButtonVariant } from './ArcButton';
import { PHOSPHOR_MUTED } from './content/phosphorOverlayStyles';
import type { ArcOverlayVisualTheme } from './tacticalOverlayRollout';

import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';

export type { ArcOverlayVisualTheme };

/** 행성정보·행성개발 기준 — panel 오버레이 공통 잉크·버튼·구분선 */
export function resolveOverlayVisualTokens(theme: ArcOverlayVisualTheme) {
  const isTactical = theme === 'tactical';
  return {
    isTactical,
    labelInk: isTactical ? TACTICAL_OVERLAY.labelInk : PHOSPHOR_MUTED,
    valueInk: isTactical ? TACTICAL_OVERLAY.valueInk : OVERLAY_TOKENS.valueContentColor,
    bodyInk: isTactical ? TACTICAL_OVERLAY.bodyInk : OVERLAY_TOKENS.valueContentColor,
    accentInk: isTactical ? TACTICAL_OVERLAY.labelInk : OVERLAY_TOKENS.phosphorAccent,
    spinnerInk: isTactical ? TACTICAL_OVERLAY.labelInk : OVERLAY_TOKENS.phosphorAccent,
    insetBorder: isTactical ? TACTICAL_OVERLAY.insetBorder : OVERLAY_TOKENS.phosphorBorder,
    insetBg: isTactical ? TACTICAL_OVERLAY.insetBg : OVERLAY_TOKENS.phosphorCardInsetBg,
    rowDivider: isTactical ? TACTICAL_OVERLAY.rowDivider : 'rgba(110, 128, 160, 0.35)',
    btnSecondaryBorder: isTactical ? TACTICAL_OVERLAY.btnSecondaryBorder : OVERLAY_TOKENS.phosphorBorder,
    btnSecondaryBg: isTactical ? TACTICAL_OVERLAY.btnSecondaryBg : OVERLAY_TOKENS.phosphorBtnBg,
    btnPrimaryBorder: isTactical ? TACTICAL_OVERLAY.btnPrimaryBorder : OVERLAY_TOKENS.phosphorBorder,
    btnPrimaryBg: isTactical ? TACTICAL_OVERLAY.btnPrimaryBg : OVERLAY_TOKENS.phosphorBtnBgEmphasis,
    buttons: resolveOverlayArcButtonVariants(isTactical),
  } as const;
}

export function resolveOverlayArcButtonVariants(isTactical: boolean): {
  primary: ArcButtonVariant;
  secondary: ArcButtonVariant;
  cta: ArcButtonVariant;
} {
  return {
    primary: isTactical ? 'tacticalPrimary' : 'primary',
    secondary: isTactical ? 'tacticalSecondary' : 'secondary',
    cta: isTactical ? 'tacticalPrimary' : 'cta',
  };
}

/** @deprecated `resolveOverlayArcButtonVariants(isTactical)` */
export function resolvePlanetDevArcButtonVariants(isTactical: boolean) {
  return resolveOverlayArcButtonVariants(isTactical);
}

export type OverlayInkRole = 'label' | 'value' | 'body' | 'accent';

export function overlayInkColor(theme: ArcOverlayVisualTheme, role: OverlayInkRole): string {
  const tokens = resolveOverlayVisualTokens(theme);
  switch (role) {
    case 'label':
      return tokens.labelInk;
    case 'value':
      return tokens.valueInk;
    case 'body':
      return tokens.bodyInk;
    case 'accent':
      return tokens.accentInk;
    default:
      return tokens.labelInk;
  }
}
