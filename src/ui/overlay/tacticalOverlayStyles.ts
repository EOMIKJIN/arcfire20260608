import { StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';

/** G-ARCHIVE — 최상단 헤더 탭만 어두운 그레이 · 본문은 라이트 그레이 */
export const TACTICAL_OVERLAY = {
  headerBg: '#252930',
  headerTopAccent: 'rgba(255, 255, 255, 0.12)',
  headerBorder: 'rgba(255, 255, 255, 0.08)',
  headerPatternStroke: 'rgba(255, 255, 255, 0.07)',
  cardBg: '#DDE1E8',
  cardBorder: '#B8BEC9',
  bodyInk: '#1A2332',
  labelInk: '#526483',
  valueInk: '#1A2332',
  sectionBarBg: '#B8BEC9',
  sectionBarInk: '#1A2332',
  insetBg: '#D0D5DE',
  insetBorder: '#B8BEC9',
  footerBg: '#D4D9E2',
  footerBorder: '#B8BEC9',
  /** 확인 — 헤더 탭과 동일 어두운 그레이 + 흰색 라벨 */
  btnPrimaryBg: '#252930',
  btnPrimaryBorder: '#1A1E24',
  btnPrimaryInk: '#FFFFFF',
  btnSecondaryBg: 'transparent',
  btnSecondaryBorder: 'rgba(26, 35, 50, 0.28)',
  btnSecondaryInk: '#526483',
  rowDivider: 'rgba(26, 35, 50, 0.12)',
} as const;

export const tacticalOverlayTitleHeaderStyles = StyleSheet.create({
  shell: {
    backgroundColor: TACTICAL_OVERLAY.headerBg,
  },
  accentTop: {
    backgroundColor: TACTICAL_OVERLAY.headerTopAccent,
  },
  bottomRule: {
    backgroundColor: TACTICAL_OVERLAY.headerBorder,
  },
});

export const tacticalOverlayCardStyles = StyleSheet.create({
  card: {
    borderColor: TACTICAL_OVERLAY.cardBorder,
    backgroundColor: TACTICAL_OVERLAY.cardBg,
    borderRadius: 8,
  },
  bodyPanel: {
    backgroundColor: TACTICAL_OVERLAY.cardBg,
  },
  footerDock: {
    borderTopColor: TACTICAL_OVERLAY.footerBorder,
    backgroundColor: TACTICAL_OVERLAY.footerBg,
  },
});

export const tacticalOverlayInfoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TACTICAL_OVERLAY.rowDivider,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: 18,
    color: TACTICAL_OVERLAY.labelInk,
  },
  rowValue: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
    lineHeight: 18,
    color: TACTICAL_OVERLAY.valueInk,
  },
});

export const tacticalPlanetEconomyOverlayStyles = StyleSheet.create({
  capitalSubtitle: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'center',
    letterSpacing: 0.3,
    color: TACTICAL_OVERLAY.labelInk,
  },
  pgpBanner: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: TACTICAL_OVERLAY.insetBorder,
    borderRadius: 4,
    backgroundColor: TACTICAL_OVERLAY.insetBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pgpLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.5,
    color: TACTICAL_OVERLAY.labelInk,
  },
  pgpValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
    flexShrink: 1,
    color: TACTICAL_OVERLAY.valueInk,
  },
  section: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: TACTICAL_OVERLAY.sectionBarBg,
    borderRadius: 2,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TACTICAL_OVERLAY.sectionBarInk,
    overflow: 'hidden',
  },
});

/** tactical 헤더 — 기존 titleHeader 위에 STRATEGIC CMD 접두 */
export function formatTacticalOverlayTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return 'STRATEGIC CMD';
  return trimmed.toUpperCase();
}

export function tacticalTitleHeaderSubtitle(subtitle?: string): string | undefined {
  if (!subtitle) return undefined;
  return subtitle.toUpperCase();
}
