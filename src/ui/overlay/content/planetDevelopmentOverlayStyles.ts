import { StyleSheet } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';

export const planetDevelopmentOverlayStyles = StyleSheet.create({
  hint: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    textAlign: 'center',
    opacity: 0.8,
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
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: SPACING.md,
  },
  listItemImageSlot: {
    width: 72,
    height: 72,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    backgroundColor: 'rgba(8, 18, 32, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listItemImagePlaceholder: {
    fontSize: 28,
    opacity: 0.88,
  },
  listItemBody: {
    flex: 1,
    minWidth: 0,
  },
  listItemSummary: {
    marginTop: 4,
    minHeight: 48,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    lineHeight: 16,
    opacity: 0.88,
  },
  listItemComingSoonBadge: {
    opacity: 0.72,
  },
  listItemStatusComplete: {
    marginTop: SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    opacity: 0.95,
  },
  listItemProgressBlock: {
    marginTop: SPACING.xs,
  },
  listItemProgressLabel: {
    marginBottom: 4,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    opacity: 0.92,
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
    flexShrink: 0,
    marginTop: SPACING.md,
  },
  btnCol: {
    flexShrink: 0,
    rowGap: SPACING.sm,
  },
  footerStack: {
    alignSelf: 'stretch',
    rowGap: SPACING.md,
  },
});
