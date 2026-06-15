import { StyleSheet } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';

export const planetDevelopmentOverlayStyles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    maxHeight: '86%',
    borderWidth: 1.5,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 6,
    padding: SPACING.lg,
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  title: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    opacity: 0.85,
  },
  hint: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    opacity: 0.8,
  },
  scroll: {
    marginTop: SPACING.md,
    maxHeight: 340,
  },
  scrollContent: {
    paddingBottom: SPACING.sm,
  },
  section: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingVertical: 3,
  },
  rowLabel: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
  },
  rowValue: {
    flex: 1,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    textAlign: 'right',
  },
  listItem: {
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listItemPressed: {
    opacity: 0.85,
  },
  listItemDisabled: {
    opacity: 0.72,
  },
  listItemTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
  },
  listItemTitleDisabled: {
    opacity: 0.85,
  },
  listItemMeta: {
    marginTop: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    opacity: 0.9,
  },
  levelRow: {
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(110,128,160,0.35)',
  },
  levelRowActive: {
    backgroundColor: 'rgba(53,208,255,0.08)',
  },
  levelRowTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
  },
  levelRowMeta: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    opacity: 0.85,
  },
  gaugeBlock: {
    marginVertical: SPACING.sm,
  },
  btnRow: {
    marginTop: SPACING.md,
  },
  btnCol: {
    marginTop: SPACING.md,
    rowGap: SPACING.sm,
  },
});
